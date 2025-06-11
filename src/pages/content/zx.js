console.log('成功植入浏览器,现在window已经是同一个,可以进行修改,要在manifest里面配置静态资源路径', chrome)
// 保存原始的 XMLHttpRequest 构造函数
const OriginalXMLHttpRequest = window.XMLHttpRequest;
let list = []
let timer = null
let my_xhr = null, isCollect = false, collectData = false
const flag = localStorage.getItem('start_look') ? JSON.parse(localStorage.getItem('start_look')) : false
const requestMap = {

}
if (flag) {
    console.log(flag)
    // 重写 XMLHttpRequest 构造函数
    window.XMLHttpRequest = function () {
        const temureg = /https:\/\/www\.temu\.com\/search_result\.html/
        if (temureg.test(location.href)) {
            // 这个地方插入一个按钮
            const divEl = document.createElement('div')
            divEl.style.position = 'fixed'
            divEl.style.top = '250px'
            divEl.style.right = '80px'
            divEl.innerText = '点击开始监听'
            divEl.style.cursor = 'pointer'
            divEl.onclick = function() {
                console.log('我启动了')
                collectData = true
                // 看看里面存了什么
                console.log(requestMap.list_el)
                if (requestMap.list_el) {
                    // 发给background
                    chrome.runtime.sendMessage('nniceknhnmnjjhakclikapdojinhiblb', {
                        message: 'sendWordList',
                        wordList: requestMap.list_el.responseText
                    })
                }
            }
            document.body.appendChild(divEl)
        }
        const xhr = new OriginalXMLHttpRequest();
        my_xhr = xhr
        let requestBody;
        // 重写 send 方法，获取请求体
        const originalSend = xhr.send;
        const originalOpen = xhr.open
        let haveSave = false
        let temuSave = false
        xhr.open = function(...data) {
            // 拿到地址
            requestUrl = data
            // 如果是我要的分仓地址,那么就保存数据到本地
            // 看看我的temu的"/api/poppy/v1/search?scene=search"
            console.log(requestUrl)
            // https://seller-acs.aliexpress.com/h5/mtop.asf.local.supply.fulfillment.shipping.fulfill.record.get/1.0/
            let reg = /seller-acs\.aliexpress\.com\/h5\/mtop\.asf\.local\.supply\.fulfillment\.shipping\.fulfill\.record\.get\/1\.0\//
            let reg2 = /api\/shipout-shipment\/shipment\/getShipmentByOrderId/
            let reg3 = /api\/poppy\/v1\/search\?scene=search/
            // temu的拿产品路径
            // let temuReg = /https:\/\/www\.temu\.com\/api\/poppy\/v1\/search\?scene=search/
            if (reg.test(requestUrl[1])) {
                console.log('Request Url', requestUrl)
            } else if (reg2.test(requestUrl[1])) {
                // 那么就设置我要保存
                haveSave = true
            } else if (reg3.test(requestUrl[1])) {
                requestMap.list_el = xhr
            } else if (collectData) {
                
            }
            originalOpen.call(this, ...data)
        }
        xhr.send = function (...data) {
            requestBody = data;
            console.log('我是发送请求', data)
            if (isCollect) {
                isCollect = false
                console.log('Request Body:', requestBody);
            } else if (haveSave) {
                haveSave = false
                localStorage.setItem('shipout_params', requestBody)
            } else if (temuSave) {
                // 包是的,所以锁掉
                temuSave = false
                console.log('按道理应该是优的啊', requestBody)
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
        // 这个是下载维赢的
        let down = document.querySelector('.downloadWork')
        // 这个是下载派派的
        let downPaiPai = document.querySelector('.downloadWorkByOms')
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
            downPaiPai.onclick = function() {
                console.log('这就是我抓到的数据', list)
                let xlsxData = []
                if (list.length) {
                    // 证明有单子 那么就开始循环
                    for (let index = 0; index < list.length; index++) {
                        // 数量
                            let item = list[index]
                            let num = item.partialPackagedRate.split('/')[1]
                            let code = item.receiverZip[0]
                            // 这个地方去调用邮编帮我算吧 哎~
                            xlsxData = xlsxData.concat([[item.tradeOrderId, '', 'aliExpress','仓库名称', '发货仓库面单', 'usps-手指头','', item.fulfillmentOrderItemList[0].itemCode,'100',item.fulfillmentOrderItemList[0].quantity,'100','CNY','',item.receiverName,item.receiverMobile,'', item.receiverZip, item.receiverCountry, item.receiverProvince,item.receiverCity,'',item.receiverAddressDetail]])
                    }
                    // 循环结束导出
                    localStorage.setItem('cacheAliexpressByOms',JSON.stringify(xlsxData))
                }
            }
        } 
    }
}


