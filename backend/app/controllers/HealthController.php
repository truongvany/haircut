<?php
namespace App\Controllers;
use App\Core\Controller;

class HealthController extends Controller {
  public function status(){
    return $this->json(['status'=>'ok','time'=>date('c')]);
  }
}
