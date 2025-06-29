const express = require('express');
const {isLoggedIn, isNotLoggedIn} = require('../middlewares');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

const{createGood, renderMain, renderJoin, renderGood, renderAuction, bid, renderList} = require('../controllers');
const router = express.Router();



router.get('/', renderMain);

router.get('/join', isNotLoggedIn, renderJoin);

router.get('/good', isLoggedIn, renderGood);

// uploads 폴더가 있나 확인하고, 없으면 새로 생성
try {
    fs.readdirSync('uploads');
} catch(err) {
    console.error('uploads 폴더가 없어 새로 생성합니다.');
    fs.mkdirSync('uploads');
};

const upload = multer({
    storage: multer.diskStorage({
        destination(req,file,cb) {
            cb(null, 'uploads/');
        },
        filename(req,file, cb) {
            const ext = path.extname(file.originalname);
            cb(null, path.basename(file.originalname, ext) + new Date().valueOf() + ext);
        },
    }),
    limits: {fileSize: 5*1024*1024},
});

// main.html
router.get('/', renderMain);
router.get('/good/:id', isLoggedIn, renderAuction);

// good.html
router.post('/good', isLoggedIn, upload.single('img'), createGood);

// auction.html
router.post('/good/:id/bid', isLoggedIn, bid);

// layout.html
router.get('/list', isLoggedIn, renderList);

module.exports = router;