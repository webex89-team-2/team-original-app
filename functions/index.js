const { onSchedule } = require("firebase-functions/v2/scheduler");
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { onDocumentWritten } = require("firebase-functions/v2/firestore");
const { logger } = require("firebase-functions");
const admin = require("firebase-admin");
const sgMail = require("@sendgrid/mail");
const { zonedTimeToUtc, format } = require("date-fns-tz");

admin.initializeApp();
const db = admin.firestore();

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
} else {
  console.error("SendGrid APIキーが.envファイルに設定されていません。");
}

/**
 * @name checkAndSendAlert
 * @description 特定ユーザーの通知を計算し、条件を満たせばメールを予約する共通関数
 */
const checkAndSendAlert = async (uid) => {
  const userDoc = await db.collection("users").doc(uid).get();
  if (!userDoc.exists) {
    logger.error(`ユーザー(uid:${uid})のドキュメントが見つかりません。`);
    return;
  }

  const user = userDoc.data();
  const settings = user.notificationSettings || {
    enabled: false,
    itemThreshold: 3,
    daysBefore: 3,
    notificationTime: "09:00",
  };

  if (!settings.enabled || !user.email) {
    if (user.email && !settings.enabled)
      logger.info(`ユーザー(uid:${uid})の通知はオフです。`);
    return;
  }

  const timeZone = "Asia/Tokyo";
  const todayStrInJST = format(new Date(), "yyyy-MM-dd", { timeZone });
  const todayStartInJST = zonedTimeToUtc(todayStrInJST, timeZone);
  const notifyDate = new Date(todayStartInJST);
  notifyDate.setDate(todayStartInJST.getDate() + settings.daysBefore);
  const targetDateStart = notifyDate;
  const targetDateEnd = new Date(
    notifyDate.getTime() + (24 * 60 * 60 * 1000 - 1)
  );

  const expiringFoodsQuery = db
    .collection("users")
    .doc(uid)
    .collection("foods")
    .where("expiresAt", ">=", targetDateStart)
    .where("expiresAt", "<=", targetDateEnd);
  const expiringFoodsSnapshot = await expiringFoodsQuery.get();

  if (expiringFoodsSnapshot.size >= settings.itemThreshold) {
    const todayFormatted = format(new Date(), "yyyy-MM-dd", { timeZone });
    const targetDateTimeString = `${todayFormatted}T${settings.notificationTime}:00`;
    const targetDateInUTC = zonedTimeToUtc(targetDateTimeString, timeZone);
    const sendAtTimestamp = Math.floor(targetDateInUTC.getTime() / 1000);

    if (targetDateInUTC.getTime() < new Date().getTime()) {
      logger.info(
        `ユーザー(uid:${uid})の通知時間(${settings.notificationTime})は既に過ぎているため予約をスキップします。`
      );
      return;
    }

    const expiringFoodNames = expiringFoodsSnapshot.docs
      .map((doc) => `- ${doc.data().name}`)
      .join("\n");
    const msg = {
      to: user.email,
      from: "hiraeese@gmail.com",
      subject: `【食品管理アプリ】${settings.daysBefore}日後に期限が切れる食品のお知らせ`,
      text: `こんにちは！\n\n${settings.daysBefore}日後に以下の食品（${expiringFoodsSnapshot.size}品）の消費期限が切れます。\n\n${expiringFoodNames}\n\n早めにチェックしましょう！`,
      send_at: sendAtTimestamp,
    };
    try {
      await sgMail.send(msg);
      logger.info(
        `ユーザー(uid:${uid})のメールを${settings.notificationTime}(JST)に予約しました。`
      );
    } catch (error) {
      logger.error(
        `メール予約に失敗しました: ${uid}`,
        error.response?.body || error
      );
    }
  } else {
    logger.info(
      `ユーザー(uid:${uid})には通知対象の食品（${settings.daysBefore}日後期限切れ）が${settings.itemThreshold}個未満でした。`
    );
  }
};

/**
 * @name sendExpirationAlerts
 * @description 【本番機能1】毎日決まった時刻に全ユーザーをチェックする
 */
exports.sendExpirationAlerts = onSchedule("every day 03:00", async (event) => {
  logger.info("定期実行バッチ処理を開始します。");
  const usersSnapshot = await db.collection("users").get();
  for (const userDoc of usersSnapshot.docs) {
    await checkAndSendAlert(userDoc.id);
  }
});

/**
 * @name checkAndScheduleOnFoodWrite
 * @description 【本番機能2】食品が追加/更新されたらリアルタイムで通知を再計算する
 */
exports.checkAndScheduleOnFoodWrite = onDocumentWritten(
  "users/{uid}/foods/{foodId}",
  async (event) => {
    const uid = event.params.uid;
    logger.info(
      `ユーザー(uid:${uid})のfoodsに書き込みがありました。通知を再計算します。`
    );
    await checkAndSendAlert(uid);
  }
);

/**
 * @name sendTestEmail
 * @description 【開発用機能】SendGridとの連携をテストする
 */
exports.sendTestEmail = onCall(async (request) => {
  logger.info("--- sendTestEmail関数が開始されました ---");
  if (!request.auth) {
    throw new HttpsError(
      "unauthenticated",
      "この機能は認証されたユーザーのみが利用できます。"
    );
  }
  const userEmail = request.auth.token.email;
  if (!userEmail) {
    throw new HttpsError(
      "invalid-argument",
      "ユーザーにメールアドレスがありません。"
    );
  }
  const msg = {
    to: userEmail,
    from: "hiraeese@gmail.com",
    subject: "【食品管理アプリ】送信テストメール",
    text: "このメールが表示されれば、SendGridとCloud Functionの連携は成功です！",
  };
  try {
    await sgMail.send(msg);
    logger.info(`テストメールを ${userEmail} に送信しました。`);
    return { success: true, message: "テストメールの送信に成功しました。" };
  } catch (error) {
    logger.error("テストメールの送信に失敗しました:", error);
    throw new HttpsError("internal", "メールの送信に失敗しました。");
  }
});
