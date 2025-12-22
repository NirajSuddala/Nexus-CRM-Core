import Queue from 'bull';
import redis from '../config/redis';
import { sendEmail } from '../config/email';

// Create queues
export const emailQueue = new Queue('email', {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
  },
});

export const reportQueue = new Queue('report', {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
  },
});

export const notificationQueue = new Queue('notification', {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
  },
});

// Email queue processor
emailQueue.process(async (job) => {
  const { to, subject, html } = job.data;
  await sendEmail(to, subject, html);
  return { sent: true };
});

// Report queue processor (for scheduled reports)
reportQueue.process(async (job) => {
  const { reportType, userId, email, params } = job.data;

  // TODO: Generate report based on type and params
  // For now, just log that we would generate the report
  console.log(`Generating ${reportType} report for user ${userId}`);

  // Send email with report
  const html = `
    <div style="font-family: Arial, sans-serif;">
      <h2>Your Scheduled Report</h2>
      <p>Your ${reportType} report has been generated.</p>
      <p>Parameters: ${JSON.stringify(params)}</p>
      <p>Generated at: ${new Date().toISOString()}</p>
    </div>
  `;

  await sendEmail(email, `Nexus CRM - ${reportType} Report`, html);
  return { generated: true };
});

// Notification queue processor
notificationQueue.process(async (job) => {
  const { userId, type, title, message, data } = job.data;

  // Import here to avoid circular dependency
  const { emitNotification } = await import('../socket');

  try {
    emitNotification(userId, { type, title, message, data });
  } catch (error) {
    console.error('Failed to emit notification:', error);
  }

  return { sent: true };
});

// Queue event handlers
emailQueue.on('completed', (job) => {
  console.log(`Email job ${job.id} completed`);
});

emailQueue.on('failed', (job, err) => {
  console.error(`Email job ${job?.id} failed:`, err.message);
});

reportQueue.on('completed', (job) => {
  console.log(`Report job ${job.id} completed`);
});

reportQueue.on('failed', (job, err) => {
  console.error(`Report job ${job?.id} failed:`, err.message);
});

// Helper functions
export const scheduleEmail = async (to: string, subject: string, html: string, delay?: number) => {
  const options = delay ? { delay } : undefined;
  return emailQueue.add({ to, subject, html }, options);
};

export const scheduleReport = async (
  reportType: string,
  userId: string,
  email: string,
  params: Record<string, any>,
  schedule?: string
) => {
  const jobData = { reportType, userId, email, params };

  if (schedule) {
    // For recurring reports, use repeat option
    return reportQueue.add(jobData, {
      repeat: { cron: schedule },
    });
  }

  return reportQueue.add(jobData);
};

export const scheduleNotification = async (
  userId: string,
  type: string,
  title: string,
  message: string,
  data?: any,
  delay?: number
) => {
  const options = delay ? { delay } : undefined;
  return notificationQueue.add({ userId, type, title, message, data }, options);
};
