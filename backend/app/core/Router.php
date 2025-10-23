<?php
namespace App\Core;

class Router {
  private $routes = ['GET'=>[], 'POST'=>[], 'PUT'=>[], 'DELETE'=>[]];
  private $base;

  public function __construct($base = '') { $this->base = rtrim($base,'/'); }

  public function get($p,$h){ $this->map('GET',$p,$h); }
  public function post($p,$h){ $this->map('POST',$p,$h); }
  public function put($p,$h){ $this->map('PUT',$p,$h); }
  public function delete($p,$h){ $this->map('DELETE',$p,$h); }

  private function map($method,$path,$handler){
    $this->routes[$method][] = [$this->compile($path), $handler];
  }

  private function compile($path){
    $pattern = preg_replace('#\{([a-zA-Z_][a-zA-Z0-9_]*)\}#','(?P<$1>[^/]+)', $path);
    $pattern = rtrim($pattern,'/');
    return '#^'.$this->base.$pattern.'$#';
  }

  public function run(){
    $method = $_SERVER['REQUEST_METHOD'];
    $uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
    foreach($this->routes[$method] as [$regex,$handler]){
      if (preg_match($regex,$uri,$m)) {
        [$class,$action] = explode('@',$handler);
        $params = array_filter($m,'is_string',ARRAY_FILTER_USE_KEY);
        return (new $class)->$action($params);
      }
    }
    http_response_code(404);
    echo json_encode(['error'=>'Not Found','path'=>$uri], JSON_UNESCAPED_UNICODE);
  }
}
