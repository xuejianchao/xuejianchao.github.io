var height = 400;
var width = 600;
var colorSet = {
  provinceColor: ["#f9bdbb", "#f36c60",
    "#e84e40", "#e51c32"
  ],
  provinceHignlineColor: 'rgb(255,0,0)',
  cityColor: "rgb(255,242,0)",
  background: '#ccc',
}

var studentInfo = [];
var cityInfo = [];

var chinaprojection = d3.geoMercator()
  .center([107, 31])
  .translate([width / 2, height / 2 + 70])
  .scale([500]);

var chinapath = d3.geoPath()
  .projection(chinaprojection);

var chinacolor = d3.scaleQuantize()
  .range(colorSet.provinceColor);

var svg = d3.select("#svgContainer")
  .append("svg")
  .attr("class", "svg")
  .attr("width", width)
  .attr("height", height);

var sv = document.getElementById('svgContainer');
var nameSearchButton = document.querySelector("#searchConfirm");
var nameInput = document.querySelector("[name = nameInput]");
var fileToRead = document.querySelector("#filetoread");
var readFilePath = '/uploads/' + fileToRead.innerText;

//读入每个省份多少人
d3.csv("/province.csv", function (chinadata) {

  //set domain of quantize scale
  chinacolor.domain([
    d3.min(chinadata, function (chinad) {
      return chinad.Num;
    }),
    d3.max(chinadata, function (chinad) {
      return chinad.Num;
    })
  ]);

  //画路径,地图
  d3.json("/china.json", function (chinajson) {

    var dealt_time = 150;
    //merge the csv into json
    for (var i = 0; i < chinadata.length; i++) {
      var Num = parseFloat(chinadata[i].Num);
      var dataProvince = chinadata[i].Province;

      for (var j = 0; j < chinajson.features.length; j++) {

        var jsonProvince = chinajson.features[j].properties.name;

        if (jsonProvince == dataProvince) {
          //the new added property are called num
          chinajson.features[j].properties.num = Num;
          break;
        }
      }
    };

    //bind the json with path element;
    //append path element
    svg.selectAll("path")
      .data(chinajson.features)
      .enter()
      .append("path")
      .attr("d", chinapath)
      .attr("id", function (d) {
        return d.properties.name;
      })
      .attr("fill", function (d) {
        var num = d.properties.num;
        var fill;

        if (num) {
          fill = chinacolor(num);
        } else {
          fill = colorSet.background;
        }
        return fill;
      })
      .style("stroke", "white")
      .style("stroke-width", 0.1)
      .on("mouseover", pathMouseOverHandler)
      .on("mouseout", pathMouseOutHandler);

    //handler
    function pathMouseOverHandler() {


      var thisPath = d3.select(this);
      if (event.relatedTarget.tagName == "circle" && event.relatedTarget.__data__.Province ==
        this.__data__.properties.name) {
        //如果从所属的圆圈进来的话，就什么也不做，因为进入圆圈的时候，省份高亮并没有消失，所以再次进入省份是就不必添加高亮
      } else {
        if (thisPath.attr("fill") == colorSet.background) {
          //进入没有学生的省份时也有相应的分支,只不过分支里什么处理都没有罢了.
          //注意,这里是通过.attr()方法来获取颜色,而不是thisPath.attributes.fill来引用.
        } else {
          thisPath.transition().duration(dealt_time).attr("fill", colorSet.provinceHignlineColor);
        }
      }
    }

    //非常奇怪，简直不能再奇怪了
    //如果下面这个函数声明不加参数的话,event就能正常使用;一旦加上就不行了.
    function pathMouseOutHandler() {

      if (event.relatedTarget.tagName == "circle" && event.relatedTarget.__data__.Province ==
        this.__data__.properties.name) {

      } else {
        d3.select(this)
          .transition()
          .duration(dealt_time)
          .attr("fill", function (d) {
            var num = d.properties.num;

            if (num) {
              return chinacolor(num);
            } else {
              return colorSet.background;
            }
          });
      }
    }

    //因为回调函数是异步执行,所以要想让画圆和添加圆的监听器都在画地图之后执行.
    //就要把画圆和添加圆的监听器的代码都放在画地图的回调函数里面.
    //画圆
    d3.csv("/city.csv", function (chinaCityData) {

      svg.selectAll("circle")
        .data(chinaCityData)
        .enter()
        .append("circle")
        .attr("cx", function (d) {
          return chinaprojection([d.lon, d.lat])[0];
        })

        .attr("cy", function (d) {
          return chinaprojection([d.lon, d.lat])[1];
        })
        .attr("r", function (d) {
          if (0 !== parseInt(d.num)) {
            return Math.sqrt(parseInt(d.num) * 40)
          } else {
            return 0;
          }
        })
        .attr("id", function (d) {
          return d.City_EN;
        })
        .style("fill", colorSet.cityColor)
        .style("stroke", "#e0e0e0")
        .style("stroke-width", 0.25)
        .style("opacity", 0.75);

      svg.selectAll('text')
        .data(chinaCityData)
        .enter()
        .append('text')
        .attr('class', 'provinceLabel')
        .attr('x', function (da) {
          return chinaprojection([da.lon, da.lat])[0];
        })
        .attr('y', function (da) {
          return chinaprojection([da.lon, da.lat])[1];
        })
        .attr('pointer-events', 'none')
        .text(function (d) {
          if (d.num != 0) {
            return d.City;
          } else {
            this.parentNode.removeChild(this);
          }
        })

      var i = 0;
      var len = chinaCityData.length;
      for (i; i < len; i++) {
        cityInfo.push(chinaCityData[i]);
      }

      //添加事件处理器
      d3.csv(readFilePath, function (chinaStudentData) {
        //遍历所有圆,加上事件处理器
        svg.selectAll("circle")
          .on("mouseover", circleMouseOverHandler)
          .on("mouseout", circleMouseOutHandler);

        console.log(readFilePath);

        var out_dealt_time = 50;

        for (var i = 0; i < chinaStudentData.length; i++) {
          //这一行是吧学生的数据保存到顶层变量中,在通过学生名字查找所在城市的时候使用.
          studentInfo.push(chinaStudentData[i]);
        }

        function circleMouseOverHandler() {

          var r = parseFloat(this.r.baseVal.valueAsString);

          if (r === 0) {
            //r为0的城市,也就是没有学生去的城市,不显示.
          } else {
            if (event.relatedTarget.tagName == "svg" || event.relatedTarget.id !=
              this.__data__.Province) {
              d3.select("#" + this.__data__.Province)
                .transition()
                .duration(150)
                .attr("fill", colorSet.provinceHignlineColor);
            }

            var thisCircle = d3.select(this);
            //bigger this circle
            //如果这里设置里渐变,但是鼠标移动的很快,在渐变效果还没完成时就出去了,变大的渐变效果就不会执行完,看起来就像圆圈变小了一样.
            thisCircle.attr('r', r * 2);

            console.log(this.__data__.City_EN);

            //吧所有符合条件的学生的信息收集到数组中
            var studentEntitled = [];
            var city_en = this.__data__.City_EN;

            for (var i = 0; i < chinaStudentData.length; i++) {
              if (chinaStudentData[i].City_EN === city_en)
                studentEntitled.push([chinaStudentData[i].Name, chinaStudentData[i].Collage]);
            }

            //fill tooltip
            var cityname = this.__data__.City;
            fillTooltip(studentEntitled, cityname);


            //show the tooltip
            var XYArray = getXYFromSVGXY([thisCircle.attr("cx"), thisCircle.style("cy")], thisCircle.style("r"));
            showTootlip(XYArray);

          }
        }

        function circleMouseOutHandler() {

          if (event.relatedTarget.tagName == "svg" || event.relatedTarget.id !=
            this.__data__.Province) {
            d3.select("#" + this.__data__.Province)
              .transition()
              .duration(150)
              .attr("fill", function (d) {
                var num = d.properties.num;

                if (num) {
                  return chinacolor(num);
                } else {
                  return colorSet.background;
                }
              });
          }

          var r = parseFloat(this.r.baseVal.valueAsString);

          //delete all stud info
          var tooltip = document.getElementById("infotooltip");
          tooltip.innerHTML = "";
          //hiden
          d3.select("#infotooltip")
            .classed("hidden", true);

          //让圆变小
          d3.select(this)
            .transition()
            .duration(out_dealt_time)
            .attr('r', r / 2);
        }
      });
    });


  });
});

var Button = document.querySelectorAll('button');
Button.forEach(function (item) {
  item.onclick = colorChangeHandler;
});

function colorChangeHandler(e) {
  switch (e.target.id) {
    case 'changeToBlue':
      colorSet.provinceColor = ['#d0d9ff',
        '#91a7ff', '#91a7ff', '#5677fc'
      ];
      colorSet.provinceHignlineColor = 'rgb(0,0,255)';
      break;

    case 'changeToGreen':
      colorSet.provinceColor = ['#a3e9a4', '#72d572',
        '#42bd41', '#259b24'
      ];
      colorSet.provinceHignlineColor = '#42f43f';
      break;

    case 'changeToRed':
      colorSet.provinceColor = ["#f9bdbb", "#f36c60",
        "#e84e40", "#e51c32"
      ];
      colorSet.provinceHignlineColor = 'rgb(255,0,0)';
      break;
  }

  //猜测chinacolor.range()的作用是改变了chinacolor的一个属性,而不是直接引用外部变量.
  //所以在这里要重新调用range(),改变chinacolor的属性.
  chinacolor.range(colorSet.provinceColor);

  svg.selectAll('path')
    .attr('fill', function (d) {
      var num = d.properties.num;

      if (num) {
        return chinacolor(num);
      } else {
        return colorSet.background;
      }
    });
}

nameSearchButton.onclick = nameSearchHandler;

function nameSearchHandler() {
  //获取名字
  var name = nameInput.value;
  var city = "";
  var school = "";
  var city_EN = "";
  var SVGCoordition = [];
  var coordition = [];
  var r = 0;

  //在student中获得学生的学校和城市.
  studentInfo.forEach(function (d) {
    if (d.Name == name) {
      city = d.City;
      school = d.Collage;
    }
  });
  //防御性编程
  if (!city) {
    nameInput.value = "名字不对哦";
    return;
  }

  //找到city的坐标
  cityInfo.forEach(function (d) {
    if (d.City == city) {
      city_EN = d.City_EN;
      var cityCircle = d3.select("#" + city_EN);
      SVGCoordition = [cityCircle.attr("cx"), cityCircle.attr("cy")]
    }
  });

  d3.select("#" + city_EN)
    .style("fill", colorSet.provinceHignlineColor);

  coordition = getXYFromSVGXY(SVGCoordition, d3.select("#" + city_EN).attr("r"));
  fillTooltip([
    [name, school]
  ], city);
  showTootlip(coordition);
}

function getXYFromSVGXY(SVGXYArray, r) {
  //接收SVG元素在SVG视口内的坐标,返回可以直接使用的(x,y)坐标对.
  //具体来说,这个函数作用的东西肯定是一个svg元素.所以是需要加上svg边框的距离的.

  var svgContainer = document.getElementById("svgContainer");
  var svgReact = svgContainer.getBoundingClientRect();
  var svgToLeft = svgReact.left;
  var svgToTop = svgReact.top;

  var left = svgToLeft + parseFloat(SVGXYArray[0]) + 5 + parseFloat(r);
  var top = svgToTop + parseFloat(SVGXYArray[1]) - parseFloat(r);

  return ([left, top]);
}

function showTootlip(coorditionArray) {
  //接受一个(x,y)坐标对,直接赋给tooltip,并且改变tooltip的状态.
  //0--x;1--y;
  var tooltip = document.querySelector("#infotooltip");

  tooltip.style.left = coorditionArray[0] + "px";
  tooltip.style.top = coorditionArray[1] + "px";

  d3.select("#infotooltip")
    .classed("hidden", false);
}

function fillTooltip(infoList, titleContentAsArg) {
  //接收标题,要填进去的内容(以数组的形式)
  var tooltip = document.querySelector("#infotooltip");

  var title = document.createElement("p");
  var titleContent = document.createTextNode(titleContentAsArg);
  title.appendChild(titleContent);
  title.className = "title";
  tooltip.appendChild(title);

  for (var i = 0; i < infoList.length; i++) {
    var info = infoList[i].join("-");
    var para = document.createElement("p");
    var text = document.createTextNode(info);
    para.appendChild(text);

    tooltip.appendChild(para);
  }
}