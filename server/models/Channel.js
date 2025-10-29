import mongoose from 'mongoose';

const channelSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Channel name is required'],
    trim: true,
    maxlength: [50, 'Channel name cannot exceed 50 characters'],
    validate: {
      validator: function(name) {
        // For DM channels, we'll use a different naming pattern
        if (this.type === 'direct') {
          return name.length <= 50;
        }
        return true;
      },
      message: 'DM channel name is too long'
    }
  },
  description: {
    type: String,
    maxlength: [200, 'Description cannot exceed 200 characters'],
  },
  type: {
    type: String,
    enum: ['public', 'private', 'direct'],
    default: 'public',
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  members: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    role: {
      type: String,
      enum: ['admin', 'member'],
      default: 'member',
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
  }],
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

// Index for faster queries
channelSchema.index({ name: 1, type: 1 });
channelSchema.index({ 'members.user': 1 });

// Virtual for display name - this is what the client should use
channelSchema.virtual('displayName').get(function() {
  if (this.type === 'direct') {
    // For DM channels, show the other user's name
    if (this.members && this.members.length === 2) {
      // This would need to be populated to work properly
      return `DM with ${this.members.find(m => m.user._id.toString() !== this.createdBy.toString())?.user?.username || 'User'}`;
    }
    return 'Direct Message';
  }
  return this.name;
});

// Ensure virtuals are included in JSON output
channelSchema.set('toJSON', { virtuals: true });

// FIX: Use channelSchema instead of channelModel
export default mongoose.model('Channel', channelSchema);