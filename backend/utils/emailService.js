const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

const sendWelcomeEmail = async (email, username) => {
  const htmlContent = `
    <h1>Welcome to EcoJourney!</h1>
    <p>Hello ${username},</p>
    <p>Thank you for joining our community dedicated to environmental sustainability.</p>
    <p>You can now start exploring and creating content on EcoJourney.</p>
  `;

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: email,
    subject: 'Welcome to EcoJourney',
    html: htmlContent,
  });
};

const sendPasswordResetEmail = async (email, resetLink) => {
  const htmlContent = `
    <h1>Password Reset Request</h1>
    <p>Click the link below to reset your password (valid for 1 hour):</p>
    <a href="${resetLink}">${resetLink}</a>
    <p>If you didn't request this, please ignore this email.</p>
  `;

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: email,
    subject: 'Password Reset Request',
    html: htmlContent,
  });
};

const sendContentSubmissionNotification = async (email, contentTitle) => {
  const htmlContent = `
    <h1>Content Submission Confirmation</h1>
    <p>Your content "<strong>${contentTitle}</strong>" has been submitted successfully.</p>
    <p>It is now pending review by our content managers.</p>
  `;

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: email,
    subject: 'Content Submission Confirmation',
    html: htmlContent,
  });
};

const sendContentApprovedEmail = async (email, contentTitle) => {
  const htmlContent = `
    <h1>Content Approved!</h1>
    <p>Great news! Your content "<strong>${contentTitle}</strong>" has been approved.</p>
    <p>It will soon be published on EcoJourney.</p>
  `;

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: email,
    subject: 'Content Approved',
    html: htmlContent,
  });
};

const sendContentRejectedEmail = async (email, contentTitle, reason) => {
  const htmlContent = `
    <h1>Content Rejected</h1>
    <p>Unfortunately, your content "<strong>${contentTitle}</strong>" has been rejected.</p>
    <p><strong>Reason:</strong> ${reason}</p>
    <p>Please revise and resubmit if needed.</p>
  `;

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: email,
    subject: 'Content Rejected',
    html: htmlContent,
  });
};

module.exports = {
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendContentSubmissionNotification,
  sendContentApprovedEmail,
  sendContentRejectedEmail,
};
