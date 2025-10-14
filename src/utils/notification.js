const nodemailer = require('nodemailer');
const config = require('../config');
const logger = require('./logger');

// 邮件传输器
let emailTransporter;
if (config.SMTP_HOST && config.SMTP_USER && config.SMTP_PASS) {
  emailTransporter = nodemailer.createTransporter({
    host: config.SMTP_HOST,
    port: config.SMTP_PORT,
    secure: config.SMTP_PORT === 465,
    auth: {
      user: config.SMTP_USER,
      pass: config.SMTP_PASS
    }
  });
}

/**
 * 发送邮件
 * @param {Object} options - 邮件选项
 * @returns {Promise<boolean>} 发送结果
 */
const sendEmail = async (options) => {
  if (!emailTransporter) {
    logger.warn('Email service not configured');
    return false;
  }

  try {
    const mailOptions = {
      from: `"${config.SMTP_USER}" <${config.SMTP_USER}>`,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html
    };

    const result = await emailTransporter.sendMail(mailOptions);
    logger.info(`Email sent to ${options.to}: ${result.messageId}`);
    return true;
  } catch (error) {
    logger.error('Email send failed:', error);
    return false;
  }
};

/**
 * 发送验证码邮件
 * @param {string} email - 收件人邮箱
 * @param {string} code - 验证码
 * @param {string} type - 验证码类型
 * @returns {Promise<boolean>} 发送结果
 */
const sendVerificationEmail = async (email, code, type = '注册') => {
  const subject = `${type}验证码`;
  const html = `
    <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
      <h2 style="color: #333;">${type}验证码</h2>
      <p>您的${type}验证码是：</p>
      <div style="background-color: #f4f4f4; padding: 20px; text-align: center; font-size: 24px; font-weight: bold; color: #333; margin: 20px 0;">
        ${code}
      </div>
      <p style="color: #666;">验证码有效期为5分钟，请尽快完成验证。</p>
      <p style="color: #999; font-size: 12px;">如果您没有进行${type}操作，请忽略此邮件。</p>
    </div>
  `;

  return await sendEmail({
    to: email,
    subject,
    html
  });
};

/**
 * 发送密码重置邮件
 * @param {string} email - 收件人邮箱
 * @param {string} resetLink - 重置链接
 * @returns {Promise<boolean>} 发送结果
 */
const sendPasswordResetEmail = async (email, resetLink) => {
  const subject = '密码重置';
  const html = `
    <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
      <h2 style="color: #333;">密码重置</h2>
      <p>您请求重置密码，请点击下面的链接进行重置：</p>
      <div style="text-align: center; margin: 20px 0;">
        <a href="${resetLink}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
          重置密码
        </a>
      </div>
      <p style="color: #666;">链接有效期为30分钟，请尽快完成重置。</p>
      <p style="color: #999; font-size: 12px;">如果您没有请求重置密码，请忽略此邮件。</p>
    </div>
  `;

  return await sendEmail({
    to: email,
    subject,
    html
  });
};

/**
 * 发送欢迎邮件
 * @param {string} email - 收件人邮箱
 * @param {string} username - 用户名
 * @returns {Promise<boolean>} 发送结果
 */
const sendWelcomeEmail = async (email, username) => {
  const subject = '欢迎注册';
  const html = `
    <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
      <h2 style="color: #333;">欢迎加入我们！</h2>
      <p>亲爱的${username}，</p>
      <p>感谢您注册我们的服务。我们很高兴为您提供优质的点餐体验。</p>
      <div style="background-color: #f4f4f4; padding: 20px; margin: 20px 0;">
        <h3 style="color: #333;">快速开始：</h3>
        <ul>
          <li>浏览附近餐厅</li>
          <li>选择您喜欢的菜品</li>
          <li>享受快速配送服务</li>
        </ul>
      </div>
      <p style="color: #666;">如有任何问题，请随时联系我们的客服团队。</p>
      <p style="color: #999; font-size: 12px;">祝您用餐愉快！</p>
    </div>
  `;

  return await sendEmail({
    to: email,
    subject,
    html
  });
};

/**
 * 发送订单确认邮件
 * @param {string} email - 收件人邮箱
 * @param {Object} orderData - 订单数据
 * @returns {Promise<boolean>} 发送结果
 */
const sendOrderConfirmationEmail = async (email, orderData) => {
  const subject = '订单确认';
  const html = `
    <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
      <h2 style="color: #333;">订单确认</h2>
      <p>您好，您的订单已确认：</p>
      <div style="background-color: #f4f4f4; padding: 20px; margin: 20px 0;">
        <h3>订单信息</h3>
        <p><strong>订单号：</strong>${orderData.orderId}</p>
        <p><strong>订单金额：</strong>¥${orderData.amount}</p>
        <p><strong>下单时间：</strong>${new Date(orderData.createdAt).toLocaleString()}</p>
        <p><strong>预计送达时间：</strong>${orderData.estimatedDeliveryTime}</p>
      </div>
      <div style="background-color: #f4f4f4; padding: 20px; margin: 20px 0;">
        <h3>配送地址</h3>
        <p>${orderData.address.recipient} ${orderData.address.phone}</p>
        <p>${orderData.address.province} ${orderData.address.city} ${orderData.address.district}</p>
        <p>${orderData.address.detailedAddress}</p>
      </div>
      <p style="color: #666;">我们会尽快为您配送，请保持电话畅通。</p>
    </div>
  `;

  return await sendEmail({
    to: email,
    subject,
    html
  });
};

/**
 * 发送短信（模拟）
 * @param {string} phone - 手机号
 * @param {string} message - 短信内容
 * @returns {Promise<boolean>} 发送结果
 */
const sendSMS = async (phone, message) => {
  if (!config.SMS_ACCESS_KEY || !config.SMS_ACCESS_SECRET) {
    logger.warn('SMS service not configured');
    return false;
  }

  try {
    // 这里应该集成真实的短信服务
    // 如阿里云短信、腾讯云短信等
    logger.info(`SMS sent to ${phone}: ${message}`);

    // 模拟发送成功
    return true;
  } catch (error) {
    logger.error('SMS send failed:', error);
    return false;
  }
};

/**
 * 发送短信验证码
 * @param {string} phone - 手机号
 * @param {string} code - 验证码
 * @param {string} type - 验证码类型
 * @returns {Promise<boolean>} 发送结果
 */
const sendSMSCode = async (phone, code, type = '注册') => {
  const message = `【GoodPayBack】您的${type}验证码是${code}，5分钟内有效。请勿泄露给他人。`;
  return await sendSMS(phone, message);
};

/**
 * 发送订单状态通知
 * @param {string} phone - 手机号
 * @param {Object} orderData - 订单数据
 * @returns {Promise<boolean>} 发送结果
 */
const sendOrderStatusSMS = async (phone, orderData) => {
  const message = `【GoodPayBack】您的订单${orderData.orderId}状态已更新为：${orderData.status}。`;
  return await sendSMS(phone, message);
};

module.exports = {
  sendEmail,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail,
  sendOrderConfirmationEmail,
  sendSMS,
  sendSMSCode,
  sendOrderStatusSMS
};