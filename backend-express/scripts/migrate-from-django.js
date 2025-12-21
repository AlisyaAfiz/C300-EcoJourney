#!/usr/bin/env node

/**
 * Migration script to transfer data from Django SQLite to Express MongoDB
 * Run this script from the backend-express directory after setting up MongoDB
 */

require('dotenv').config();
const mongoose = require('mongoose');
const sqlite3 = require('better-sqlite3');
const path = require('path');

// Import models
const User = require('./models/User');
const UserRole = require('./models/UserRole');
const PasswordResetToken = require('./models/PasswordResetToken');
const ContentCategory = require('./models/ContentCategory');
const MultimediaContent = require('./models/ContentApprovalWorkflow');
const ContentApprovalWorkflow = require('./models/ApprovalWorkflow');

// Path to Django SQLite database
const DB_PATH = '../backend/db.sqlite3';

async function migrate() {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ecojourney');
    console.log('MongoDB connected');

    // Open SQLite database
    console.log('Opening SQLite database...');
    const db = new sqlite3(path.join(__dirname, DB_PATH));

    // Migrate UserRoles
    console.log('Migrating user roles...');
    const roles = db.prepare('SELECT * FROM user_roles').all();
    for (const role of roles) {
      await UserRole.updateOne(
        { _id: role.id },
        {
          name: role.name,
          description: role.description,
          createdAt: new Date(role.created_at),
          updatedAt: new Date(role.updated_at),
        },
        { upsert: true }
      );
    }
    console.log(`✓ Migrated ${roles.length} user roles`);

    // Migrate Users
    console.log('Migrating users...');
    const users = db.prepare('SELECT * FROM users').all();
    for (const user of users) {
      await User.updateOne(
        { _id: user.id },
        {
          username: user.username,
          email: user.email,
          password: user.password,
          firstName: user.first_name,
          lastName: user.last_name,
          phone: user.phone || '',
          organization: user.organization || '',
          role: user.role_id,
          profilePicture: user.profile_picture,
          bio: user.bio || '',
          lastLoginIp: user.last_login_ip,
          loginAttempts: user.login_attempts,
          isLocked: user.is_locked,
          lockedUntil: user.locked_until ? new Date(user.locked_until) : null,
          createdAt: new Date(user.created_at),
          updatedAt: new Date(user.updated_at),
        },
        { upsert: true }
      );
    }
    console.log(`✓ Migrated ${users.length} users`);

    // Migrate Password Reset Tokens
    console.log('Migrating password reset tokens...');
    const tokens = db.prepare('SELECT * FROM password_reset_tokens').all();
    for (const token of tokens) {
      await PasswordResetToken.updateOne(
        { _id: token.id },
        {
          user: token.user_id,
          token: token.token,
          createdAt: new Date(token.created_at),
          expiresAt: new Date(token.expires_at),
          isUsed: token.is_used,
          usedAt: token.used_at ? new Date(token.used_at) : null,
        },
        { upsert: true }
      );
    }
    console.log(`✓ Migrated ${tokens.length} password reset tokens`);

    // Migrate Content Categories
    console.log('Migrating content categories...');
    const categories = db.prepare('SELECT * FROM content_categories').all();
    for (const category of categories) {
      await ContentCategory.updateOne(
        { _id: category.id },
        {
          name: category.name,
          description: category.description,
          colorCode: category.color_code,
          createdAt: new Date(category.created_at),
          updatedAt: new Date(category.updated_at),
        },
        { upsert: true }
      );
    }
    console.log(`✓ Migrated ${categories.length} content categories`);

    // Migrate Multimedia Content
    console.log('Migrating multimedia content...');
    const content = db.prepare('SELECT * FROM multimedia_content').all();
    for (const item of content) {
      await MultimediaContent.updateOne(
        { _id: item.id },
        {
          title: item.title,
          description: item.description,
          contentType: item.content_type,
          category: item.category_id,
          file: item.file,
          thumbnail: item.thumbnail,
          tags: (item.tags || '').split(',').filter(t => t.trim()),
          status: item.status,
          creator: item.creator_id,
          viewCount: item.view_count,
          createdAt: new Date(item.created_at),
          updatedAt: new Date(item.updated_at),
          publishedAt: item.published_at ? new Date(item.published_at) : null,
        },
        { upsert: true }
      );
    }
    console.log(`✓ Migrated ${content.length} multimedia content items`);

    // Migrate Content Approval Workflows
    console.log('Migrating content approval workflows...');
    const workflows = db.prepare('SELECT * FROM content_approval_workflows').all();
    for (const workflow of workflows) {
      await ContentApprovalWorkflow.updateOne(
        { _id: workflow.id },
        {
          content: workflow.content_id,
          status: workflow.status,
          approver: workflow.approver_id,
          comments: workflow.comments,
          createdAt: new Date(workflow.created_at),
          updatedAt: new Date(workflow.updated_at),
        },
        { upsert: true }
      );
    }
    console.log(`✓ Migrated ${workflows.length} approval workflows`);

    db.close();
    await mongoose.disconnect();

    console.log('\n✅ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration error:', error);
    process.exit(1);
  }
}

migrate();
