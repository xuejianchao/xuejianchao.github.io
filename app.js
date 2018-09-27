var path = require('path');
var express = require('express');
var multer = require('multer');
var csv = require("fast-csv");


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
      cb(null, "upload" + file.originalname);
    },
  })
});

app.get('/', function (req, res, next) {
  res.render('index');
});

app.get('/chinamap', function (req, res, next) {
  res.render('chinamap',{
    filetoread: '国一.csv',
    charTitle: '国一.csv'
  });
})

app.post('/chinamap/upload', upload.single('studentInfo'), function (req, res, next) {
  //更新两个csv文件
  updateTwoCSV(req.file.filename);
  //渲染
  res.render('chinamap', {
    filetoread: req.file.filename,
    chartTitle: req.file.filename,
  });
});

app.listen(8000);

//现在的问题是更新了文件之后,需要刷新一下界面才能把圆圈的事件处理器加上

function updateTwoCSV(postfile) {
  var targetCSVPath = "./public/uploads/"+postfile;
  var provinceCSVPath = "./public/province.csv";
  var cityCSVPath = "./public/city.csv";

  console.log("start update");
  //以下全都是更新数据时用的后台代码,接收到"更新图像的命令"
  //由后台代码调用
  var numForEachCity = [];
  var numForEachProvince = [];
  csv.fromPath(targetCSVPath)
    .on("data", function (data) {
      //注意,data是数组,而不是对象
      //问题:现在连表头都读进来了,查询有没有不读表头的选项
      function findCorrectCity(thisCity) {
        return thisCity.city === data[3];
      }
      var queryResult = numForEachCity.find(findCorrectCity);

      if (queryResult === undefined) {
        //如果找不到,就加上他的城市,数值初始化为1
        numForEachCity.push({
          city: data[3],
          num: 1,
        })
      } else {
        //如果能在foreachcity中找到他的城市,就给城市的数值加一
        queryResult.num++;
      }

      function findCorrectProvince(thisProvince) {
        return thisProvince.province === data[2];
      }
      var queryResult = numForEachProvince.find(findCorrectProvince);

      if (queryResult === undefined) {
        numForEachProvince.push({
          province: data[2],
          num: 1,
        })
      } else {
        queryResult.num++;
      }

    })
    .on("end", function () {
      console.log(numForEachCity);
      console.log(numForEachProvince);
      console.log("done");

      var cityCSVData = [];

      csv.fromPath(cityCSVPath, {
          headers: true
          //加入header之后,读入的data就被解析为对象
        })
        .on("data", function (data) {
          //这个实在上面的end结束之后执行的,可以放心用
          function isThisInList(thisCityInList) {
            return thisCityInList.city === data.City;
          }

          var queryResult = numForEachCity.find(isThisInList);
          if (queryResult) {
            data.num = queryResult.num;
          } else {
            data.num = 0;
          }
          //将修改完的city.CSV文件中的数据放进数组
          cityCSVData.push(data);
        })
        .on("end", function () {
          console.log(cityCSVData);
          //写回修改完的citycsv数据
          csv
            .writeToPath(cityCSVPath, cityCSVData, {
              headers: true
            })
            .on("finish", function () {
              console.log("wirte back citycsv done!");
            });
        });



      var provinceNumData = [];
      //然后是读入province并修改,
      csv.fromPath(provinceCSVPath, {
          headers: true
        })
        .on("data", function (proFromFile) {

          function findCorrectProvince(thisProFromList) {
            return thisProFromList.province === proFromFile.Province;
          }

          var queryResult = numForEachProvince.find(findCorrectProvince);
          if (queryResult) {
            proFromFile.Num = queryResult.num;
          } else {
            proFromFile.Num = 0;
          }
          console.log(proFromFile);
          provinceNumData.push(proFromFile);
        })
        .on('end', function () {
          //写回
          csv
            .writeToPath(provinceCSVPath, provinceNumData, {
              headers: true
            })
            .on('finish', function () {
              console.log(provinceNumData);
              console.log('wirte province back done!');
            })
        })
    });
}