const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

const sendWelcomeEmail = async (email, username) => {
  try {
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
    console.log(`Welcome email sent to ${email}`);
  } catch (error) {
    console.error(`Error sending welcome email to ${email}:`, error.message);
    // Don't throw, allow registration to proceed
  }
};

const sendPasswordResetEmail = async (email, resetLink) => {
  try {
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
  } catch (error) {
    console.error(`Error sending password reset email to ${email}:`, error.message);
  }
};

const sendContentSubmissionNotification = async (email, contentTitle) => {
  try {
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
  } catch (error) {
    console.error(`Error sending submission notification to ${email}:`, error.message);
  }
};

const sendContentApprovedEmail = async (email, contentTitle) => {
  try {
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
  } catch (error) {
    console.error(`Error sending approval email to ${email}:`, error.message);
  }
};

const sendContentRejectedEmail = async (email, contentTitle, reason) => {
  try {
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
  } catch (error) {
    console.error(`Error sending rejection email to ${email}:`, error.message);
  }
};

module.exports = {
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendContentSubmissionNotification,
  sendContentApprovedEmail,
  sendContentRejectedEmail,
};
