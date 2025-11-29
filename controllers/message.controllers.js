import Conversation from "../model/conversation.model.js";
import messageModel from "../model/message.model.js";
import { asyncHandler } from "../utilities/asyncHandler.utilities.js";
import { errorHandler } from "../utilities/errorHandler.utilities.js";
import { getSocketId, io } from "../socket/socket.js";
export const sendMessage = asyncHandler(async (req, res, next) => {
  const senderId = req.user._id;
  const receiverId = req.params.receiverId;
  const message = req.body.message;

  if (!senderId || !receiverId || !message) {
    return next(new errorHandler("All field are required", 400));
  }

  let conversation = await Conversation.findOne({
    participants: { $all: [senderId, receiverId] },
  });

  if (!conversation) {
    conversation = await Conversation.create({
      participants: [senderId, receiverId],
    });
  }

  const newMessage = await messageModel.create({
    senderId,
    receiverId,
    message,
  });

  if (newMessage) {
    conversation.messages.push(newMessage._id);
    await conversation.save();
  }
  // socket.io
  // send msg to the specific user. not everyone. now go to socket.js to getSocketID through userID
  const socketId = getSocketId(receiverId);
  io.to(socketId).emit("newMessage", newMessage);
  // .to(yaha socketId ai ga becoz hm realtime ma msg bheajh rha ha.)
  res.status(200).json({
    success: true,
    responseData: newMessage,
  });
});

export const getMessages = asyncHandler(async (req, res, next) => {
  const senderId = req.user._id;
  const receiverId = req.params.receiverId;

  if (!senderId || !receiverId) {
    return next(new errorHandler("All fields are required", 400));
  }

  const conversation = await Conversation.findOne({
    participants: { $all: [senderId, receiverId] },
  }).populate("messages");

  if (!conversation) {
    return res.status(200).json({
      success: true,
      responseData: [], // No messages yet
    });
  }

  res.status(200).json({
    success: true,
    responseData: conversation,
  });
});
