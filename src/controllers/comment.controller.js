const getVideoComments = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    const result = await Comment.aggregate([
        { $match: { video: new mongoose.Types.ObjectId(videoId) } },
        { $sort: { createdAt: -1 } }
    ]).facet({
        metadata: [{ $count: "total" }],
        data: [{ $skip: (page - 1) * limit }, { $limit: parseInt(limit) }]
    });

    res.status(200).json(
        new ApiResponse(200, result, "Fetched video comments")
    );
});

const addComment = asyncHandler(async (req, res) => {
    const { videoId, content } = req.body;

    if (!videoId || !content) {
        throw new ApiError(400, "Video ID and content are required");
    }

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    const newComment = await Comment.create({
        content,
        video: videoId,
        owner: req.user._id
    });

    res.status(201).json(
        new ApiResponse(201, newComment, "Comment added successfully")
    );
});

const updateComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params;
    const { content } = req.body;

    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid comment ID");
    }

    const comment = await Comment.findById(commentId);
    if (!comment) {
        throw new ApiError(404, "Comment not found");
    }

    if (comment.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "Unauthorized to update this comment");
    }

    comment.content = content || comment.content;
    await comment.save();

    res.status(200).json(
        new ApiResponse(200, comment, "Comment updated successfully")
    );
});

const deleteComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params;

    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid comment ID");
    }

    const comment = await Comment.findById(commentId);
    if (!comment) {
        throw new ApiError(404, "Comment not found");
    }

    if (comment.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "Unauthorized to delete this comment");
    }

    await comment.deleteOne();

    res.status(200).json(
        new ApiResponse(200, null, "Comment deleted successfully")
    );
});
