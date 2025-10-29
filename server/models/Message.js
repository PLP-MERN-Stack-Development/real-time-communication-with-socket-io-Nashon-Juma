import mongoose from 'mongoose';

const reactionSchema = new mongoose.Schema({
  emoji: {
    type: String,
    required: true,
  },
  users: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  count: {
    type: Number,
    default: 0,
  },
});

const messageSchema = new mongoose.Schema({
  content: {
    type: String,
    required: function() {
      return !this.attachment && !this.system;
    },
    trim: true,
    maxlength: [5001, 'Message cannot exceed 5001 characters'],
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  channel: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Channel',
    required: true,
  },
  attachment: {
    url: String,
    filename: String,
    mimetype: String,
    size: Number,
  },
  replyTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message',
  },
  reactions: [reactionSchema],
  readBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    readAt: {
      type: Date,
      default: Date.now,
    },
  }],
  system: {
    type: Boolean,
    default: false,
  },
  edited: {
    isEdited: {
      type: Boolean,
      default: false,
    },
    editedAt: Date,
  },
  deleted: {
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: Date,
  },
}, {
  timestamps: true,
});

// Index for faster queries
messageSchema.index({ channel: 1, createdAt: -1 });
messageSchema.index({ sender: 1 });
messageSchema.index({ 'readBy.user': 1 });

// Virtual for message type
messageSchema.virtual('type').get(function() {
  if (this.system) return 'system';
  if (this.attachment) return 'file';
  return 'text';
});

export default mongoose.model('Message', messageSchema);