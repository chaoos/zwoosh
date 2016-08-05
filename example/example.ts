import swoosh from '../swoosh'

var div1 = document.getElementById("div1");
var div2 = document.getElementById("div2");
var div3 = document.getElementById("div3");
var body = document.body;

var s4 = swoosh(body, {
  elasticEgdes: {
    left:0,
    right:0,
    top:50,
    bottom:50,
  }
});

var s1 = swoosh(div1, {
  grid: 50,
  callback: function(e){
    console.log('inside the options callback, obj-instance: ', this, 'event: ', e);
    return true;
  }})
  .on('collideLeft', function(e){
    console.log('inside 2nd callback (collideLeft event): instance: ', this, 'event: ', e);
    return true;
  })
  .on('collideTop', function(e){
    console.log('inside 2nd callback (collideTop event): instance: ', this, 'event: ', e);
    return true;
  })
  .on('collideRight', function(e){
    console.log('inside 2nd callback (collideRight event): instance: ', this, 'event: ', e);
    return true;
  })
  .on('collideBottom', function(e){
    console.log('inside 2nd callback (collideBottom event): instance: ', this, 'event: ', e);
    return true;
  });

var s2 = swoosh(div2, {
    elasticEgdes: {
    left:100,
    right:100,
    top:200,
    bottom:200,
  }
});

var s3 = swoosh(div3, {});

