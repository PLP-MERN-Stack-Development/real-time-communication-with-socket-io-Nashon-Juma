import mongoose from 'mongoose';
import { faker } from '@faker-js/faker';
import dotenv from 'dotenv';
import { User, Channel, Message } from '../models/index.js';
import bcrypt from 'bcryptjs';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ongeza-chat';

const seedDatabase = async () => {
  try {
    console.log('🌱 Starting database seeding...');
    
    // Connect to database
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to database');

    // Clear existing data
    await User.deleteMany({});
    await Channel.deleteMany({});
    await Message.deleteMany({});
    console.log('✅ Cleared existing data');

    // Create test users with properly hashed passwords
    const users = [];
    const testUsers = [
      {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123', // Will be hashed
        avatar: null,
        status: 'online'
      },
      {
        username: 'johndoe',
        email: 'john@example.com',
        password: 'password123',
        avatar: null,
        status: 'online'
      },
      {
        username: 'sarahsmith',
        email: 'sarah@example.com',
        password: 'password123',
        avatar: null,
        status: 'away'
      },
      {
        username: 'mikejohnson',
        email: 'mike@example.com',
        password: 'password123',
        avatar: null,
        status: 'busy'
      },
      {
        username: 'emilywilson',
        email: 'emily@example.com',
        password: 'password123',
        avatar: null,
        status: 'online'
      }
    ];

    for (const userData of testUsers) {
      // Hash password using the same method as in User model
      const salt = await bcrypt.genSalt(12);
      const hashedPassword = await bcrypt.hash(userData.password, salt);
      
      const user = new User({
        username: userData.username,
        email: userData.email,
        password: hashedPassword, // Use the hashed password
        avatar: userData.avatar,
        status: userData.status
      });
      
      await user.save();
      users.push(user);
      console.log(`✅ Created user: ${user.username} (${user.email})`);
    }

    // Create public channels
    const channels = [];
    const channelNames = ['general', 'random', 'development', 'design', 'marketing'];

    for (const channelName of channelNames) {
      const channel = new Channel({
        name: channelName,
        description: faker.lorem.sentence(),
        type: 'public',
        createdBy: users[0]._id,
        members: users.map(user => ({
          user: user._id,
          role: 'member'
        }))
      });
      await channel.save();
      await channel.populate('members.user', 'username avatar status');
      channels.push(channel);
      console.log(`✅ Created channel: ${channel.name}`);
    }

    // Create direct message channels with shorter names
    const dmChannels = [];
    for (let i = 1; i < users.length; i++) {
      // Use shorter names for DM channels
      const dmName = `dm-${users[0].username}-${users[i].username}`;
      
      const dmChannel = new Channel({
        name: dmName,
        type: 'direct',
        createdBy: users[0]._id,
        members: [
          { user: users[0]._id, role: 'member' },
          { user: users[i]._id, role: 'member' }
        ]
      });
      await dmChannel.save();
      await dmChannel.populate('members.user', 'username avatar status');
      dmChannels.push(dmChannel);
      console.log(`✅ Created DM channel between ${users[0].username} and ${users[i].username}`);
    }

    // Create messages for each channel
    const messageTemplates = [
      "Hey everyone! 👋",
      "How's it going?",
      "I just finished working on the new feature",
      "Does anyone have feedback on this?",
      "Let's schedule a meeting to discuss this",
      "I found a great resource for this",
      "Can someone help me with this issue?",
      "That's a great idea! 💡",
      "I'll work on that tomorrow",
      "Thanks for your help!",
      "What do you think about this approach?",
      "I'm running into some issues with the implementation",
      "Let me share my screen to show you",
      "That makes sense, thanks for explaining",
      "I'll update the documentation",
      "Happy Friday! 🎉",
      "Has anyone tested the latest build?",
      "I'm available for a call if needed",
      "Great work team! 👏",
      "Looking forward to the release!"
    ];

    // Add some channel-specific messages
    const channelSpecificMessages = {
      'general': [
        "Welcome to the general channel!",
        "This is where we discuss general topics",
        "Feel free to introduce yourself here"
      ],
      'random': [
        "Anyone watching any good shows lately?",
        "What's everyone doing this weekend?",
        "Just found this amazing meme 😂"
      ],
      'development': [
        "I'm working on the new API endpoints",
        "Has anyone reviewed the latest PR?",
        "The build is failing due to test issues"
      ],
      'design': [
        "I've updated the design system",
        "Can we get feedback on the new mockups?",
        "The color scheme needs some adjustments"
      ],
      'marketing': [
        "The new campaign is launching next week",
        "Let's discuss the social media strategy",
        "Analytics show great engagement this month"
      ]
    };

    for (const channel of [...channels, ...dmChannels]) {
      const messageCount = faker.number.int({ min: 8, max: 20 });
      const messages = [];
      
      for (let i = 0; i < messageCount; i++) {
        const randomUser = faker.helpers.arrayElement(channel.members.map(m => m.user));
        
        // For public channels, sometimes use channel-specific messages
        let content;
        if (channel.type === 'public' && channelSpecificMessages[channel.name] && Math.random() > 0.7) {
          content = faker.helpers.arrayElement(channelSpecificMessages[channel.name]);
        } else {
          content = faker.helpers.arrayElement(messageTemplates);
        }

        const message = new Message({
          content: content,
          sender: randomUser._id,
          channel: channel._id,
          createdAt: faker.date.recent({ days: 7 })
        });
        messages.push(message);
      }

      // Save all messages for this channel
      await Message.insertMany(messages);
      console.log(`✅ Created ${messages.length} messages for ${channel.type === 'direct' ? 'DM' : channel.name}`);
    }

    console.log('🎉 Database seeding completed successfully!');
    console.log('\n📊 Seeding Summary:');
    console.log(`   Users: ${users.length}`);
    console.log(`   Public Channels: ${channels.length}`);
    console.log(`   DM Channels: ${dmChannels.length}`);
    console.log(`   Total Messages: ${await Message.countDocuments()}`);
    console.log('\n🔑 Test User Credentials (ALL use same password):');
    console.log('   Password: password123');
    users.forEach(user => {
      console.log(`   ${user.email} (${user.username})`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
};

seedDatabase();