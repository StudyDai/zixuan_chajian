console.log('成功植入浏览器,现在window已经是同一个,可以进行修改,要在manifest里面配置静态资源路径')
// 保存原始的 XMLHttpRequest 构造函数
const OriginalXMLHttpRequest = window.XMLHttpRequest;
let list = []
let timer = null
// 重写 XMLHttpRequest 构造函数
 {
    window.XMLHttpRequest = function () {
            const xhr = new OriginalXMLHttpRequest();
            let requestBody;
            // 重写 send 方法，获取请求体
            const originalSend = xhr.send;
            xhr.send = function (data) {
                requestBody = data;
                console.log('Request Body:', requestBody);
                originalSend.call(this, data);
            };
            const reg = /https:\/\/csp\.aliexpress\.com\/m_apps\/logistics/
            if (reg.test(location.href)) {
                timer = setInterval(() => {
                    clearInterval(timer)
                    if (xhr.responseText) {
                        let data = JSON.parse(xhr.responseText)
                        if (data) {
                            console.log(data)
                            if (data.v === '1.0') {
                                console.log(data)
                                list = list.concat(data.data.data.dataSource)
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
                                        timer = setInterval(function() {
                                            clearInterval(timer)
                                            if (xhr.responseText) {
                                                let data = JSON.parse(xhr.responseText)
                                                if (data) {
                                                    list = list.concat(data.data.data.dataSource)
                                                }
                                            }
                                        }, 2000);
                                    }
                                }  
                            }
                        }
                    }
                }, 2000);
            }
            return xhr;
    }
}


