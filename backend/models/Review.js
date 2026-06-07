// backend/models/Review.js
import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  itemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Item', // Make sure this matches your exact Food Item model name (e.g., 'Item', 'Product', 'MenuItem')
    required: true
  },
  subOrderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ShopOrder', 
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    default: ""
  }
}, { timestamps: true });

// Prevent a user from rating the same item within the same sub-order multiple times
reviewSchema.index({ userId: 1, subOrderId: 1, itemId: 1 }, { unique: true });

const Review = mongoose.model('Review', reviewSchema);
export default Review;