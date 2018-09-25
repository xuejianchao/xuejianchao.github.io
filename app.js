var path = require('path');
var express = require('express');
var multer = require('multer');

var app = express();
app.set('views', path.join(__dirname, 'views'));
app.set("view engine", 'pug');

//mdn上的例子是这么写的,然后再pug文件中使用的是相对public的路径
app.use(express.static(path.join(__dirname, 'public')));

var upload = multer({
  storage: multer.diskStorage({
      destination: function (req, file, cb) {
          cb(null, './public/uploads');
      },
      filename: function (req, file, cb) {
          //file.originalname上传文件的原始文件名
          var changedName = (new Date().getTime()) + '-' + file.originalname;
          cb(null, changedName);
      }
  })
});

app.get('/', function (req, res, next) {
  res.render('index');
});

app.get('/chinamap',function(req, res, next){
  res.render('chinamap');
})

app.post('/upload', upload.single('studentInfo'), function (req, res, next) {
  res.render('chinamap', {
    filetoread: req.file.filename,
  });
  //这里可以使用node的文件系统的API来实现删除文件的操作
});

app.listen(8000);