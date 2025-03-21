console.log('成功植入浏览器,现在window已经是同一个,可以进行修改,要在manifest里面配置静态资源路径')
// 保存原始的 XMLHttpRequest 构造函数
const OriginalXMLHttpRequest = window.XMLHttpRequest;
let list = []
let timer = null
let my_xhr = null, isCollect = false
const flag = localStorage.getItem('start_look') ? JSON.parse(localStorage.getItem('start_look')) : false

if (flag) {
    console.log(flag)
    // 重写 XMLHttpRequest 构造函数
    window.XMLHttpRequest = function () {
        const xhr = new OriginalXMLHttpRequest();
        let requestBody;
        // 重写 send 方法，获取请求体
        const originalSend = xhr.send;
        const originalOpen = xhr.open
        let haveSave = false

            xhr.open = function(...data) {
                my_xhr = xhr
                // 拿到地址
                requestUrl = data
                // 如果是我要的分仓地址,那么就保存数据到本地
                console.log(requestUrl)
                // https://seller-acs.aliexpress.com/h5/mtop.asf.local.supply.fulfillment.shipping.fulfill.record.get/1.0/
                let reg = /seller-acs\.aliexpress\.com\/h5\/mtop\.asf\.local\.supply\.fulfillment\.shipping\.fulfill\.record\.get\/1\.0\//
                let reg2 = /api\/shipout-shipment\/shipment\/getShipmentByOrderId/
                if (reg.test(requestUrl[1])) {
                    console.log('Request Url', requestUrl)
                } else if (reg2.test(requestUrl[1])) {
                    // 那么就设置我要保存
                    haveSave = true
                }
                originalOpen.call(this, ...data)
            }
            xhr.send = function (...data) {
                requestBody = data;
                console.log(data)
                if (isCollect) {
                    isCollect = false
                    console.log('Request Body:', requestBody);
                } else if (haveSave) {
                    haveSave = false
                    localStorage.setItem('shipout_params', requestBody)
                }
                originalSend.call(this, ...data);
            };
        return xhr;
    }
    const reg = /https:\/\/csp\.aliexpress\.com\/m_apps\/logistics/
    console.log(reg.test(location.href))
    if (reg.test(location.href)) {
        // 进来就直接给按钮添加点击事件
        let work = document.querySelector('.getNetwork')
        let down = document.querySelector('.downloadWork')
        if (work) {
            down.onclick = function() {
                console.log('这就是我抓到的数据', list)
                let xlsxData = []
                if (list.length) {
                    // 证明有单子 那么就开始循环
                    for (let index = 0; index < list.length; index++) {
                        // 数量
                            let item = list[index]
                            let num = item.partialPackagedRate.split('/')[1]
                            let code = item.receiverZip[0]
                            // 美东
                            if (code < 7) {
                                // 美东 0-6
                                xlsxData = xlsxData.concat([[item.tradeOrderId, item.fulfillmentOrderItemList[0].itemCode, num, '','',item.receiverName, '', item.receiverAddressDetail, '', item.receiverProvince, item.receiverCity, item.receiverZip, item.receiverCountry, item.receiverMobile, '', 'Service with Lowest Estimate Rate', 'USPS', 'No Sign Required/ Service Default', '美东']])
                            } else {
                                // 美西 7-9
                                xlsxData = xlsxData.concat([[item.tradeOrderId, item.fulfillmentOrderItemList[0].itemCode, num, '','',item.receiverName, '', item.receiverAddressDetail, '', item.receiverProvince, item.receiverCity, item.receiverZip, item.receiverCountry, item.receiverMobile, '', 'Service with Lowest Estimate Rate', 'USPS', 'No Sign Required/ Service Default', '美西']])
                            }
                    }
                    // 循环结束导出
                    localStorage.setItem('cacheAliexpress',JSON.stringify(xlsxData))
                }
            }
            work.onclick = function() {
                console.log('我来了', my_xhr)
                // 这个地方点击才开始去收集
                isCollect = true
                timer && clearInterval(timer)
                timer = setInterval(() => {
                    if (my_xhr.responseText) {
                        let data = JSON.parse(my_xhr.responseText)
                        if (data) {
                            if (data.v === '1.0') {
                                console.log(data) 
                                // 这个就是我要的数据
                                list = list.concat(...data.data.data.dataSource)
                                clearInterval(timer)
                            } else {
                                console.log('other', data)
                            }
                        }
                    }
                }, 2000);
            }
        } 
    }
}


