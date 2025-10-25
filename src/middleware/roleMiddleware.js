exports.isShipper = (req, res, next) => {
  if (req.user.role !== "shipper")
    return res.status(403).json({ message: "Chỉ shipper mới được truy cập" });
  next();
};

exports.isUser = (req, res, next) => {
  if (req.user.role !== "user")
    return res
      .status(403)
      .json({ message: "Chỉ khách hàng được phép truy cập" });
  next();
};
