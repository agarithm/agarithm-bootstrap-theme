<?php

$ROOT ="/sampler";


$page = <<<___PAGE
<!doctype html>
<html lang="en">
  <head>
    <!-- Required meta tags -->
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">

    <!-- Bootstrap CSS -->
    <link rel="stylesheet" href="dist/css/bootstrap.css" >

    <title>Theme Sampler</title>
  </head>
  <body>
<div class=container-fluid>
<div class=row>
<div class="col-12 bg-light p-3">
{header}
</div>
</div>
</div>

<div class=container-fluid>
<div class=row>
<div class=col-sm>
<div class="custom-control custom-switch">
  <input type="checkbox" class="custom-control-input" id="customSwitch1">
  <label class="custom-control-label" for="customSwitch1">Toggle this switch element</label>
</div>
</div>
</div>
</div>
<div class=container>
<div class=row>
<div class=col-sm>
	<h1>NORMAL<h1>
	<hr>
	{{h}}
	<p>
<script>

function doLorem(){
	var what = Math.random() * 4000;
	$('#lorem').updateWith({url:'lorem.php?what='+what});
	return false;
}
</script>
	<button class="btn btn-succes" onclick='{return doLorem();}'>Show Lorem</button>
	<div id=lorem></div>
	<hr>
	{{button}}
	<hr>
	{{alert}}
	<hr>
	{{panel}}
</div>
</div>
</div>
<div class=container-fluid>
<div class=row>
<div class=col-sm>
	<h1>EDGE to EDGE<h1>
	<hr>
	{{h}}
	<p>{{lorem}}
	<hr>
	{{button}}
	<hr>
	{{panel}}
</div>
</div>
</div>

<div class=container-fluid>
<div class=row>
<div class="col-12 bg-dark text-light p-4">
{footer}
</div>
</div>
</div>

    <!-- Optional JavaScript -->
    <!-- jQuery first, then Popper.js, then Bootstrap JS -->
    <script src="https://code.jquery.com/jquery-3.3.1.min.js" ></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/popper.js/1.14.3/umd/popper.min.js" integrity="sha384-ZMP7rVo3mIykV+2+9J3UJ46jBk0WLaUAdn689aCwoqbBJiSnjAK/l8WvCWPIPm49" crossorigin="anonymous"></script>
    <script src="dist/js/bootstrap.js" ></script>
  </body>
</html>
___PAGE;


$h="";
for($i=1;$i<=6;$i++)$h .= "<h$i>Sampler H$i <strong>strong</strong>  <small>small</small></h$i>\n";

$kinds = array("primary","secondary","info","success","warning","danger","light","dark","link");
$lorem = "But I must explain to you how all this mistaken idea of denouncing pleasure and praising pain was born and I will give you a complete account of the system, and expound the actual teachings of the great explorer of the truth, the master-builder of human happiness. No one rejects, dislikes, or avoids pleasure itself, because it is pleasure, but because those who do not know how to pursue pleasure rationally encounter consequences that are extremely painful. Nor again is there anyone who loves or pursues or desires to obtain pain of itself, because it is pain, but because occasionally circumstances occur in which toil and pain can procure him some great pleasure. To take a trivial example, which of us ever undertakes laborious physical exercise, except to obtain some advantage from it? But who has any right to find fault with a man who chooses to enjoy a pleasure that has no annoying consequences, or one who avoids a pain that produces no resultant pleasure?";
$button = "<h2>Buttons:</h2>";
$btnSizes = array("","btn-lg","btn-sm","btn-block","active","disabled");
foreach($btnSizes as $size){
	$button .= "<div class=row><div class=col-12><p>&nbsp;</p><h3>$size</h3></div>";
	$button .= "<div class=col>";
	foreach($kinds as $kind){
		$button .= "<button class='btn btn-$kind $size mb-1' $size>$kind $size</button> ";

	}
	$button .= "</div>";
	$button .= "</div>";
}

$alert = "";
foreach($kinds as $kind)$alert.="<div class='alert alert-$kind'><button data-dismiss='alert' class='close' type='button'>×</button>alert-$kind</div>";

$panel = "<div class=row><div class=col-12><p>&nbsp;</p><h2>Borders</h2></div><div class=col>";
$panel .= "<div class=row>";

foreach(array("","rounded") as $shape)foreach($kinds as $kind){
	$cols = mt_rand(3,3);
	$spacer = 1;//mt_rand(2,4);
	$panel .= "<div class='col-sm-$cols'> <div class='col border border-$kind $shape p-2 mb-1'><span class=text-$kind><h4>$kind $shape</h4></span>{{lorem}}</div></div><div class='d-none d-sm-block col-$spacer'></div>";
}
$panel .= "</div>";
$panel .= "</div>";
$panel .= "</div>";

$lastPage="";
while($page!=$lastPage){
	$lastPage = $page;
	foreach(array("h","button","panel","lorem","alert") as $key) $page = str_replace('{{'.$key.'}}',$$key,$page);
}

die($page);
