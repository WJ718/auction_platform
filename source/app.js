const express = require('express');
const path = require('path');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const passport = require('passport');
const nunjucks = require('nunjucks');
const dotenv = require('dotenv');

dotenv.config();

const {sequelize} = require('./models');
const passportConfig = require('./passport')
const sse = require('./sse');
const webSocket = require('./socket');

const indexRouter = require('./routes/index');
const authRouter = require('./routes/auth');

const app =  express();
passportConfig();

app.set('port', process.env.PORT || 8010);
app.set('view engine', 'html');
nunjucks.configure('views', {
    express: app,
    watch: true,
});

sequelize.sync({force: true}) 
    .then(() => {
        console.log('데이터베이스 연결 성공');
    })
    .catch((err) => {
        console.error(err);
    });

const sessionMiddleware = session({
    resave: false,
    saveUninitialized: false,
    secret: process.env.COOKIE_SECRET,
    cookie: {
        httpOnly: true,
        secure: false,
    },
});

app.use(morgan('dev'));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/img', express.static(path.join(__dirname, 'uploads')));
app.use(cookieParser(process.env.COOKIE_SECRET));
app.use(sessionMiddleware);
app.use(passport.initialize());
app.use(passport.session());
app.use(express.json());
app.use(express.urlencoded({extended: false}))

app.use((req, res, next) => {
  res.locals.user = req.user;
  next();
});

app.use('/', indexRouter);
app.use('/auth', authRouter);



app.use((req, res, next) => {
    const error = new Error(`${req.method} ${req.url} 라우터가 없습니다.`);
    error.status  = 404;
    next(error);
});

app.use((err, req, res, next) => {
    res.locals.message = err.message;
    res.locals.error = process.env.NODE_ENV !== 'production' ? err : {};
    res.status(err.status || 500);
    res.render('error');
});

const server = app.listen(app.get('port'), () => {
    console.log(app.get('port'), '번 포트에서 대기중');
});

webSocket(server,app);
sse(server);

