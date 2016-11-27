/*
  polydir.js
  author: LU WEI
  email: whuluwei@gmail.com
*/

var map;
var gtris;
function initMap(){
  var cqpolylyr = L.geoJson(cqpolyl);
  cqpolylyr.setStyle({
        fillColor: "#fff",
        fillOpacity: 0,
        weight: 3,
        opacity: .5
    });
  var osmlyr = L.tileLayer('http://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.png',
  {attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, \
  &copy; <a href="http://cartodb.com/attributions">CartoDB</a> \
  | Works by <a href="http://lw1990.name">LU WEI</a>'});
  //console.log(cqpolyl["features"][0]["geometry"]["coordinates"][8][0]);
  map = L.map('mapcanvas',{
        center: [30.35, 107.33],
        zoom: 7,
        layers: [osmlyr, cqpolylyr]
  });
  var positronLabels = L.tileLayer('http://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}.png', {
	}).addTo(map);
}

var simplyr=null;
function simplify(tolslider, textid) {

  var x = document.getElementById(tolslider);
  var y = document.getElementById(textid);
  y.value = x.value;
  var tolerance = Number(x.value);

  if(simplyr)
    map.removeLayer(simplyr);
  var simplified = turf.simplify(cqpolyl, tolerance, false);
  simplyr = L.geoJson().addTo(map);
  simplyr.addData(simplified);
  simplyr.setStyle({
        color: "#f00",
        weight: 3,
        opacity: .5
    });
  dotriangle(simplified);
  delete simplified;
}

function dotriangle(data){
  var contour = [];
  var coors = data["features"][0]["geometry"]["coordinates"][0];
  for(var i =0; i<coors.length-1;i++)
  {
    contour.push(new poly2tri.Point(coors[i][0],coors[i][1]));
  }
  var swctx = new poly2tri.SweepContext(contour);
  swctx.triangulate();
  var triangles = swctx.getTriangles();
  drawTriangles(triangles);
  doskeleton(triangles);
}

var skellyr=null;
function doskeleton(tris) {
  if(skellyr)
    map.removeLayer(skellyr);
  var skel = [];

  tris.forEach(function (t) {
    var et = t.constrained_edge;
    var type = 0;
    et.forEach(function(r) {
      if(r == true)
        type +=1;
    });
    // type == 0:III ; type == 1: II, type == 2: I
    if(type==1){
      //console.log("II");
      var tpts = t.getPoints();
      tpts.push(tpts[0]);
      var cl = [];
      for(var i=0; i<3;i++){
        var einx = t.edgeIndex(tpts[i],tpts[i+1]);
        if(et[einx] == false){
          cl.push(new poly2tri.Point((tpts[i].x+tpts[i+1].x)/2,(tpts[i].y+tpts[i+1].y)/2));
        }
      }
      skel.push(constructLine(cl[0],cl[1]));

    }
    else if(type == 0){
      //console.log("III");
      var tpts = t.getPoints();
      var cp = new poly2tri.Point((tpts[0].x+tpts[1].x+tpts[2].x)/3,
                                  (tpts[0].y+tpts[1].y+tpts[2].y)/3);
      tpts.push(tpts[0]);
      //console.log(tpts);
      for(var i=0; i<3; i++){
        var p = new poly2tri.Point((tpts[i].x+tpts[i+1].x)/2,(tpts[i].y+tpts[i+1].y)/2);
        //console.log(p);
        //console.log(cp);
        skel.push(constructLine(cp,p));
      }

    }else {
      //console.log("I");
      var tpts = t.getPoints();
      tpts.push(tpts[0]);
      for(var i=0; i<3; i++){
        var einx = t.edgeIndex(tpts[i],tpts[i+1]);
        if(et[einx] == false){
          var p = new poly2tri.Point((tpts[i].x+tpts[i+1].x)/2,(tpts[i].y+tpts[i+1].y)/2);
          if((2-2*i)<0)
            var ii = 1;
          else
            var ii = 2-2*i;
          skel.push(constructLine(tpts[ii],p));
          break;
        }

      }
    }

  });

  skellyr = L.geoJson().addTo(map);
  skellyr.addData(skel);
  skellyr.setStyle({
        color: "#f00",
        weight: 4,
        opacity: 1
    });

}


var edgeslyr=null;
function drawTriangles(tris)
{
  if(edgeslyr)
    map.removeLayer(edgeslyr);
  var TIN = [];

  tris.forEach(function(t){
    var pts = t.getPoints();
    //console.log(pts);
    var l = {"type": "LineString",
            "coordinates":[[pts[0].x, pts[0].y],
                            [pts[1].x, pts[1].y],
                            [pts[2].x, pts[2].y],
                            [pts[0].x, pts[0].y]]};
    TIN.push(l);
    //console.log(t.getPoint(2).x);
    //break;
  });
  //console.log(TIN);
  //console.log("add to map");
  edgeslyr = L.geoJson().addTo(map);
  edgeslyr.addData(TIN);
  edgeslyr.setStyle({
        color: "#0d0",
        weight: 2,
        opacity: .5
    });
  //console.log("added.");
}

function constructLine(p1,p2){
  return {"type": "LineString",
          "coordinates":[[p1.x, p1.y], [p2.x, p2.y]]};
}

/*
function triangle(){
  var contour = [];
  console.log(cqpolyl);
  var coors = cqpolyl["features"][0]["geometry"]["coordinates"][0];
  console.log(coors.length);
  for(var i =0; i<coors.length-1;i++)
  {
    if(i>0){
      if(coors[i][0] == coors[i-1][0] && coors[i][1] == coors[i-1][1])
        continue;
    }
    contour.push(new poly2tri.Point(coors[i][0],coors[i][1]));
  }
  var swctx = new poly2tri.SweepContext(contour);
  swctx.triangulate();
  var triangles = swctx.getTriangles();
  //console.log(swctx.edge_list);
  //console.log(triangles);
  gtris = triangles;
  drawTriangles(triangles);
}

function skeleton(){
  var skel = [];

  gtris.forEach(function (t) {
    var et = t.constrained_edge;
    var type = 0;
    et.forEach(function(r) {
      if(r == true)
        type +=1;
    });
    // type == 0:III ; type == 1: II, type == 2: I
    if(type==1){
      //console.log("II");
      var tpts = t.getPoints();
      tpts.push(tpts[0]);
      var cl = [];
      for(var i=0; i<3;i++){
        var einx = t.edgeIndex(tpts[i],tpts[i+1]);
        if(et[einx] == false){
          cl.push(new poly2tri.Point((tpts[i].x+tpts[i+1].x)/2,(tpts[i].y+tpts[i+1].y)/2));
        }
      }
      skel.push(constructLine(cl[0],cl[1]));

    }
    else if(type == 0){
      //console.log("III");
      var tpts = t.getPoints();
      var cp = new poly2tri.Point((tpts[0].x+tpts[1].x+tpts[2].x)/3,
                                  (tpts[0].y+tpts[1].y+tpts[2].y)/3);
      tpts.push(tpts[0]);
      //console.log(tpts);
      for(var i=0; i<3; i++){
        var p = new poly2tri.Point((tpts[i].x+tpts[i+1].x)/2,(tpts[i].y+tpts[i+1].y)/2);
        //console.log(p);
        //console.log(cp);
        skel.push(constructLine(cp,p));
      }

    }else {
      //console.log("I");

    }

  });

  var skellyr = L.geoJson().addTo(map);
  skellyr.addData(skel);
  skellyr.setStyle({
        color: "#0f0",
        weight: 3,
        opacity: .5
    });
}
*/
