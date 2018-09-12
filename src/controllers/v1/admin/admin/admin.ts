import * as express from "express";

const router = express.Router();

router.get("/", (req: express.Request, res: express.Response) => {
    res.response({
        admin: req.user,
    });
});

export default router;
