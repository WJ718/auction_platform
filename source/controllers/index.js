const { Good, Auction, User, sequelize } = require('../models');
const {Op} = require('sequelize');
const schedule = require('node-schedule');

exports.renderMain = async (req, res, next) => {
    try {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1); // 어제 시간
      const goods = await Good.findAll({ 
        where: { SoldId: null, createdAt: { [Op.gte]: yesterday } },
      });
      res.render('main', {
        title: 'NodeAuction',
        goods,
      });
    } catch (error) {
      console.error(error);
      next(error);
    }
  };
  
  exports.renderJoin = (req, res) => {
    res.render('join', {
      title: '회원가입 - NodeAuction',
    });
  };
  
  exports.renderGood = (req, res) => {
    res.render('good', { title: '상품 등록 - NodeAuction' });
  };
  

// good.html
exports.createGood = async (req,res,next) => {
    try {
        const {name, price} = req.body;

        // 중복된 문자열 자동 제거 로직 (예시)
        const cleanedName = name.replace(/(.+)\1$/, '$1');

        const good = await Good.create({
            OwnerId: req.user.id,
            name: cleanedName,
            img: req.file.filename,
            price,
        });

        const end = new Date();
        end.setDate(end.getDate() + 1);

        // 경매 등록 시점으로부터 하루 후에 아래의 콜백 함수가 실행됨
        const job = schedule.scheduleJob(end, async() => {
            // 해당 상품에 대해 가장 높은 입찰자를 찾음 (success = 사람 객체)
            const success = await Auction.findOne({
                where: {GoodId: good.id},
                order: [['bid', 'DESC']],
            });

            // 낙찰자의 ID를 sold필드에 저장
            await good.setSold(success.UserId);

            // 낙찰 금액만큼 낙찰자의 자산에서 차감
            await user.update({
                money : sequelize.literal(`money - ${success.bid}`),
            }, {
                where: {id: success.UserId},
            });
        });

        job.on('error', (err) => {
            console.log('스케줄링 에러', err);
        });
        job.on('success', () => {
            console.log('스케줄링 성공');
        });

        res.redirect('/');
    } catch(err) {
        console.error(err);
        next(err);
    }
};

// main.html
exports.renderMain = async (req,res,next) => {
    try {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);

        const goods = await Good.findAll({ 
            where: {SoldId: null, createdAt: {[Op.gte]: yesterday}},  // Greater then equal (>=)
        });

        res.render('main', {
            title: 'MyAuction',
            goods,
            user: req.user,
        });
    } catch(err) {
        console.error(err);
        next(err);
    }
};

// main.html
exports.renderAuction = async (req,res,next) => {
    try {
        const [good, auction] = await Promise.all([
            Good.findOne({
                where: {id: req.params.id},
                include : {
                    model: User, // Good.Owner.nick 쓰기 위해
                    as: 'Owner',
                },
            }),
            Auction.findAll({
                where: {GoodId: req.params.id},
                include: {model : User},
                order: [['bid', 'ASC']], // bid.User.nick 쓰기 위함
            }),
        ]);

        res.render('auction', {
            title: `${good.name} - MyAuction`,
            good,
            auction,
        });

    } catch(err) {
        console.error(err);
        next(err);
    }
};

// 낙찰 메서드
exports.bid = async (req,res,next) => {
    try {
        const {bid, msg} = req.body;

        const good = await Good.findOne({
            where: {id: req.params.id},
            include: {model: Auction}, // 입찰 금액 제한을 위해 bid를 가져와야함
            order: [[{model: Auction}, 'bid', 'DESC']],
        });

        if(!good) {
            return res.status(404).send('해당 상품은 존재하지 않습니다.');
        }

        if(good.price >= bid) {
            return res.status(403).send('이전 입찰가보다 높아야 합니다.');
        }

        if(new Date(good.createdAt).valueOf() + (24*60*60*1000) <= new Date()) {
            return res.status(403).send('경매가 종료된 상품입니다.');
        }

        if(good.Auctions[0]?.bid >= bid) {
            return res.status(403).send('입찰 금액이 최근 입찰가보다 낮습니다!');
        }

        const result = await Auction.create({
            bid,
            msg,
            UserId: req.user.id,
            GoodId: req.params.id,
        });

        // socket으로 실시간 입찰내역 전송
        req.app.get('io').to(req.params.id).emit('bid', {
            bid: result.bid,
            msg: result.msg,
            nick: req.user.nick,
        });
        return res.send('ok');
    } catch(err) {
        console.error(err);
        next(err);
    }
};

exports.renderList = async (req,res,next) => {
    try {
        const goods = await Good.findAll({
            where: {SoldId: req.user.id},
            include: {model : Auction},
            order: [[{model :Auction}, 'bid', 'DESC']],
        });

        return res.render('list', {title: '낙찰목록', goods});
        
    } catch(err) {
        console.error(err);
        next(err);
    }
}