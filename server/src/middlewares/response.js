export const responseHandler = (req, res, next) => {
    res.success = (data = null, message = 'ok') => {
        res.json({ code: 0, message, data });
    };
    res.fail = (message = 'error', code = 1, httpStatus = 200) => {
        res.status(httpStatus).json({ code, message, data: null });
    };
    next();
};