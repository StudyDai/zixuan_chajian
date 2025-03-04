console.log('成功植入浏览器,现在window已经是同一个,可以进行修改,要在manifest里面配置静态资源路径')
// var XHR = XMLHttpRequest.prototype

// var open = XHR.open
// var send = XHR.send

// XHR.send = function(postData) {
//     console.log("请求传递的参数是", postData)
//     return send.apply(this, arguments)
// }

// XHR.open = function(method, url) {
//     console.log("请求发送中,请求路径是", url)
//     this._method = method
//     this._url = url
//     return open.apply(this,arguments)
// }
