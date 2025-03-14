console.log('content is open')
// TEMU的存储地址
const downloadList = []
// 创建一个自定义的鼠标
// 定义是否移动的标识
let isMove = false
// 有个东西包裹了中心点和线条
const dot_container = document.createElement('div')
dot_container.className = 'dot_container'
dot_container.style.position = "absolute"
dot_container.style.top = "0"
dot_container.style.left = "0"
dot_container.style.width = "52px"
dot_container.style.height = "52px"
// dot_container.style.border = '1px solid #000'
// dot_container.style.display = "flex"
dot_container.style.display = "none"
dot_container.style.justifyContent = 'center'
dot_container.style.alignItems = 'center'
dot_container.style.pointerEvents = 'none'
dot_container.style.zIndex = '9990'
// dot_container.style.transform = 'translate(-5px, -5px)'
// 创建中心点
const cursor_center = document.createElement("div")
cursor_center.className = 'cursor_center'
// 创建移动的线条
const move_line = document.createElement('div')
move_line.className = "line"
move_line.style.transformOrigin = '0 0'
move_line.style.position = "absolute"
move_line.style.height = '1px'
move_line.style.top = "50%"
move_line.style.left = "50%"
move_line.style.transform = "translate(-50%,-50%)"
move_line.style.backgroundColor = '#999'
move_line.style.backgroundImage = "linear-gradient(0deg,rgb(255 255 255 / 25%) 0%,white 33%,rgb(255 255 255 / 25%) 66%)"
move_line.style.backgroundSize = "200% 200%"
move_line.style.display = "none"
move_line.style.animation = 'engry .5s linear infinite'

// 创建外围动画方块
const block_container = document.createElement("div")
block_container.className = 'block_container'
block_container.style.position = "absolute"
block_container.style.padding = "25px"
block_container.style.zIndex = "9991"
block_container.style.width = "20px"
block_container.style.height = "20px"
block_container.style.top = "101px"
block_container.style.left = "100px"
block_container.style.border = "1px solid #999"
block_container.style.pointerEvents = "none"
block_container.style.display = 'none'

// 创建三个框框用来进行动画操作
for (let index = 0; index < 3; index++) {
    const circleEl = document.createElement('div')
    circleEl.className = "circle_item" 
    circleEl.style.setProperty('--i', index) 
    circleEl.style.display = "none"
    circleEl.style.width = "50px"
    circleEl.style.height = "50px"
    circleEl.style.position = "absolute"
    circleEl.style.left = "0"
    circleEl.style.top = "0"
    circleEl.style.transformOrigin = "center center"
    circleEl.style.border = "1px solid #999"
    circleEl.style.animation = "normals 2s calc(var(--i) * 1s) linear infinite"

    block_container.appendChild(circleEl) 
}

// 设置中间小方块的大小
cursor_center.style.width = '10px'
cursor_center.style.height = '10px'
cursor_center.style.transformOrigin = 'center center'
cursor_center.style.backdropFilter = 'invert(100%)'
cursor_center.style.transition = `transform .2s`
// 插入小方块和线条
dot_container.appendChild(cursor_center)
dot_container.appendChild(move_line)

// 记录上一个点位
let prev_x = 0
let prev_y = 0
// 监听鼠标移动
// document.addEventListener('mousemove',(event) => {
//     // 移动的时候判断我当前是不是移动标识是false,是的话就修改
//     if(!isMove) {
//         isMove = !isMove
//         block_container.classList.remove('has_item')
//         // 父亲变红
//         block_container.style.borderColor = 'red'
//     }
//     requestAnimationFrame(() => {
//         // 每次都要划线，所以要记录我上一个地址
//         const x = event.pageX
//         const y = event.pageY
//         dot_container.style.left = x + 'px'
//         dot_container.style.top = y + 'px'
//         // 200毫秒之后移动我的block_container
//         setTimeout(() => {
//             block_container.style.left = x + 'px'
//             block_container.style.top = y + 'px'
//             // 这个地方要重新算一下
//             calculateLine(dot_container, block_container, move_line)
//             // 这个地方要关掉,因为已经咩有移动了
//             isMove = !isMove
//             // 这个时候才要开启动画
//             block_container.classList.add('has_item')
//             // 父亲颜色变回来
//             block_container.style.borderColor = '#999'
//         }, 200);
//     })
// })

// 监听鼠标左键是否长按
document.addEventListener('mousedown',() => {
    // 让我的小方块变大,平时用不到啊,妈的
    // cursor_center.style.transform = 'translateY(5px) scale(5)'
})

// 监听鼠标左键是否松开
// document.addEventListener('mouseup',() => {
//     // 让我的小方块变大,暂时用不到
//     // cursor_center.style.transform = 'translateY(5px)'
// })

// 监听鼠标是否移出屏幕
// document.addEventListener('mouseleave',() => {
//     dot_container.style.opacity = "0"
//     block_container.style.opacity = "0"
// })

// 监听鼠标进入屏幕
// document.addEventListener('mouseenter', () => {
//     dot_container.style.opacity = "1"
//     block_container.style.opacity = "1"
// })

// 时间格式化
function formatTime(date = new Date(), format = 'YYYY-MM-DD HH:mm:ss') {
    const padZero = (num) => (num < 10 ? '0' + num : num);

    const year = date.getFullYear();
    const month = padZero(date.getMonth() + 1); // getMonth() 返回0-11，因此加1
    const day = padZero(date.getDate());
    const hours = padZero(date.getHours());
    const minutes = padZero(date.getMinutes());
    const seconds = padZero(date.getSeconds());

    return format.replace(/YYYY/, year)
                 .replace(/MM/, month)
                 .replace(/DD/, day)
                 .replace(/HH/, hours)
                 .replace(/mm/, minutes)
                 .replace(/ss/, seconds);
}

// 插入页面中
onload = () => {
    // 当进入shipout分仓页面的时候,提供一个按钮给导出订单
    let shipoutReg = /https:\/\/oms\.shipout\.com\/b\/#\/order\/batch-fulfillment/
    let shipout_timer = null
    shipout_timer = setInterval(() => {
        if (shipoutReg.test(location.href)) {
            clearInterval(shipout_timer)
            // 证明是对了, 给background说
            let div = document.createElement('div')
            div.classList.add('download_shipout')
            div.innerText = '下载表单'
            div.onclick = function() {
                chrome.runtime.sendMessage({
                    message: 'download_shipout_warehhouse',
                    data: {
                        param: localStorage.getItem('shipout_params'),
                        token: localStorage.getItem('accessToken'),
                        cookie: document.cookie
                    }
                })
            }
            document.body.appendChild(div)  
        }
    }, 1500);
    // 插入一个按钮用来进行监听用
    function addNetworkBtn() {
        let btn = document.createElement('div')
        btn.classList.add('getNetwork')
        btn.innerText = '监听网络'
        let btn2 = document.createElement('div')
        btn2.classList.add('downloadWork')
        btn2.innerText = '下载监听到的数据'
        let btn3 = document.createElement('div')
        btn3.classList.add('downloadAliexpress')
        btn3.innerText = '导出为Excel表格'
        btn3.onclick = function() {
            chrome.runtime.sendMessage({
                message: 'download_aliexpress_order',
                data: localStorage.getItem('cacheAliexpress')
            })
        }
        document.body.appendChild(btn)
        document.body.appendChild(btn2)
        document.body.appendChild(btn3)
    }
    const re = /https:\/\/csp\.aliexpress\.com\/m_apps\/logistics/
    if (re.test(location.href)) {
        addNetworkBtn()
    }
    // 当前如果是temu.com的话就可以显示TEMU的下载图标 
    // https://seller.kuajingmaihuo.com/
    // video--video--lsI7y97
    if (/temu\.com/.test(location.href) || /kuajingmaihuo\.com/.test(location.href)) {
        // 插入一个TEMUlogo进来
        const TEMU_EL = document.createElement('div')
        TEMU_EL.style.position = "fixed"
        TEMU_EL.style.left = '15px'
        TEMU_EL.style.top = '50%'
        TEMU_EL.innerHTML = `
            <svg class="temu_svg" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" width="54px" height="54px" class="_3My78Pdp" alt="temu" aria-label="temu" fill="#fb7701" stroke="none" stroke-width="18.962962962962962"><title>temu</title><path d="M796.4 0c125.7 0 227.6 101.9 227.6 227.6l0 568.8c0 125.7-101.9 227.6-227.6 227.6l-568.8 0c-125.7 0-227.6-101.9-227.6-227.6l0-568.8c0-125.7 101.9-227.6 227.6-227.6l568.8 0z m-256 531.9l-13.6 0c-12.1 0-22 9.8-21.9 21.9l0 150.5c0 12.1 9.8 22 21.9 22 12.1 0 22-9.8 22-22l0-98.8 37 52.2c7.7 10.8 23.7 10.8 31.5 0l37-52.2 0 98.8c0 12.1 9.8 22 22 22 12.1 0 22-9.8 21.9-22l0-150.5c0-12.1-9.8-22-21.9-21.9l-13.6 0c-5.2 0-10.2 2.5-13.2 6.8l-47.9 72-48-72c-3-4.3-7.9-6.8-13.2-6.8z m340.2 0c-12.1 0-22 9.8-22 21.9l0 91.9c0 28.9-16.3 43.7-43.1 43.6-26.8 0-43.1-15.3-43-44.9l0-90.6c0-12.1-9.8-22-22-21.9-12.1 0-22 9.8-21.9 21.9l0 91.6c0 53.6 32.8 80.9 86.4 80.9 53.6 0 87.6-27 87.5-82.2l0-90.3c0-12.1-9.8-22-21.9-21.9z m-616.9 0l-128.3 0c-12.1 0-22 9.8-22 21.9 0 12.1 9.8 22 22 22l42.2 0 0 128.3c0 12.1 9.8 22 21.9 22 12.1 0 22-9.8 22-22l0-128.3 42.2 0c12.1 0 22-9.8 22-22 0-12.1-9.8-22-22-21.9z m189.9 0l-118.9 0c-12.1 0-22 9.8-22 21.9l0 150.3c0 12.1 9.8 22 22 22l118.9 0c12.1 0 22-9.8 21.9-22 0-12.1-9.8-22-21.9-22l-97 0 0-31.2 84.4 0c12.1 0 22-9.8 22-21.9 0-12.1-9.8-22-22-22l-84.4 0 0-31.2 97 0c12.1 0 22-9.8 21.9-22 0-12.1-9.8-22-21.9-21.9z m-214.5-229.4l-4.1 0.1c-17.1 1.1-28.8 8.5-35.4 18.5-7.7-11.5-22.1-19.6-43.8-18.4l-0.5 0.7c-2.5 4-11.9 21.9 3.3 41.4 3.1 3.3 10.7 12.6 7.6 24.5l-44.1 71.3c-3.6 5.8-2 13.3 3.5 17.2 11.4 8 34.3 19 74 19 39.6 0 62.5-11 73.9-19l1.5-1.3c4.3-4.1 5.2-10.7 2-15.9l-44-71.3 0.3 1.3-0.5-2c-2.4-10.7 3.6-19.2 6.9-23l0.8-0.8c15.3-19.5 5.8-37.3 3.3-41.4l-0.4-0.7-4.3-0.2z m142.8 33.4c-15.1-30-34.7-35.1-44.5-27.3-7.5 6-24.8 29.7-26 31.3-19.1 27.1-18 33.7 6.5 49.1 13.8 8.7 24.9-2.5 29.7-5.8-2.3 14.3-9.3 36.8-19.8 52.6-5.7-4.3-9.9-7.6-12.5-10-3.3-3-8.3-2.8-11.5 0.3-1.5 1.5-2.3 3.5-2.2 5.7 0.1 2.1 1 4.1 2.5 5.5 25.5 23.3 59 36.5 94.7 36.6 35.8 0 69.5-13.2 95-36.6 3.3-3 3.4-8 0.4-11.2-3.2-3.2-8.2-3.3-11.5-0.3-2 1.8-4 3.5-6.1 5.2l-11.2-25c-1.8-4.3-3.8-9.7-6-16.2 1.1-2.7 3.4-5.3 6.7-8.7 2.4-2.4 4.4-4.8 5.9-7.1 7.4-11.7 3.2-18.6 0.9-23.2-5.3-10.8-13.6-7.3-19.6-0.9-7.4 7.8-14.6 11.2-26.2 13.8-9.7 2.2-17.2 1.1-23.4-2.8-8.6-5.3-21.8-25-21.8-25z m277.3-30.5c-32 30.4-1.3 96.5-59.5 124.6-6.4 3.1-11.7-7.1-20.3-7.1-24.3 0.2-70.7 21.6-72.5 32.4-1.5 8.9 18.3 16 76.7 16.1 50.8 0 67.2-77.3 85-77.4 17.8 0 9.5 70.1 7.6 77.4l18.6 0c-1.6-7.3-2.8-29.3-2.7-60.4 0-31.1 5.6-38 10.1-61.5 3.9-20.4-26.3-38.1-43-44.1z m182.4 2.5l-52.1 0c-33.7 0-61.7 26.1-64 59.7l-3.8 53.9c-1.8 25.6 18.5 47.3 44.1 47.4l99.4 0c25.7 0 45.9-21.7 44.2-47.4l-3.8-53.9c-2.4-33.6-30.3-59.7-64-59.7z m-442.6 124c15.7 0 27.7 7.7 32.1 22-10.7 2.8-21.4 4.2-32.3 4.1-16.4 0-22.2-1.5-32.7-4.3 4.2-12.6 18.1-21.8 32.9-21.8z m392.9-79.3l0 1.5c0 13 10.6 23.7 23.6 23.7 13 0 23.7-10.6 23.7-23.7l0-1.5c0-5.8 21-5.8 21 0l0 1.5c0 24.6-20 44.6-44.7 44.6-24.6 0-44.6-20-44.6-44.6l0-1.5c0-5.8 20.9-5.8 21 0z"></path></svg>
            <ul class="temu_menu_ul">
                <li class="menu_ul_li">
                    <div class="down_180">下载180尺寸的商品图</div>
                    <div class="down_800">下载800尺寸的商品图</div>
                    <div class="down_video">下载视频</div>
                    <div class="down_allPopup">关闭所有弹窗</div>
                </li>
            </ul>
        `
        TEMU_EL.className = 'temu_fix_logo'
        document.body.appendChild(TEMU_EL)
        const allOption = document.querySelectorAll('.menu_ul_li div')
        for (let index = 0; index < allOption.length; index++) {
            const each_menu_item = allOption[index]
            each_menu_item.onclick = _debounce(function() {
                const item_className = this.className
                switch(item_className) {
                    case 'down_180':
                        chrome.runtime.sendMessage({
                            message: 'download_TEMU_Pic',
                            size: '180',
                            downloadList: downloadList
                        })
                        break
                    case 'down_800':
                        chrome.runtime.sendMessage({
                            message: 'download_TEMU_Pic',
                            size: '800',
                            downloadList: downloadList
                        })
                        break
                    case 'down_video':
                        const videoEl = document.querySelector('.R9rmoSPn')
                        if (!videoEl) {
                            alert("该链接没有上传视频")
                        } else {
                            chrome.runtime.sendMessage({
                                message: 'download_TEMU_Video',
                                videoHref: videoEl.src
                            })
                        }
                    case 'down_allPopup':
                        const allUn = document.querySelectorAll('.undefined')
                        const markEl = document.querySelector('div[data-testid="beast-core-modal-mask"]')
                        const popupEl = document.querySelector('div[data-testid="beast-core-modal"]')
                        if (allUn) {
                            for (let index = 0; index < allUn.length; index++) {
                                allUn[index].remove() 
                            }
                        }
                        if (markEl) markEl.remove()
                        if (popupEl) popupEl.remove()
                        break;
                    default:
                        console.log('以外操作')
                }
            }, 500)
        }
        // 给这个icon添加一个右击的监听
        document.querySelector('.temu_svg').oncontextmenu = function(e) {
            e.preventDefault()
            // 我被触发了
            const menuList = document.querySelector('.temu_menu_ul')
            menuList.style.display = 'block'
            // 给整个网页添加点击监听
            document.onclick = function(e) {
                        menuList.style.display = 'none'
                        // 把监听给关了
                        document.onclick = null
            }
        }
        const imgList = document.querySelectorAll('._2AOclWz7 img')
        for (let index = 0; index < imgList.length; index++) {
            console.log(imgList[index])
            const href = imgList[index].dataset.src ? imgList[index].dataset.src : imgList[index].src
            downloadList[index] = {
                imgName: '产品图' + (index+1) + '.jpg',
                '180': href,
                '800': href.replace(/w\/180/, 'w/800')
            }
        }
        console.log(downloadList)
    } else if (/amazon\.com/.test(location.href)) {
        let amazonDownloadBtn = false
        // 如果是亚马逊就显示亚马逊的下载图标
        // 插入一个TEMUlogo进来
        const AmazonEl = document.createElement('div')
        const videoListEl = document.querySelector('.multiple-videos')
        const container = document.getElementById('div-relatedvideos')
        let btnTimer = null
        if (videoListEl) {
            // 如果存在的话,那么就去添加点击事件
            videoListEl.onclick = function(e) {
               if (!amazonDownloadBtn) {
                    amazonDownloadBtn = true
                    console.log('获取到数据了,赶紧加input')
                    
                    // 拿到所有的视频文件,下次dom更新之前
                    btnTimer = setInterval(() => {
                        const lis = container.querySelectorAll('ol li')
                        if (lis.length) {
                            clearInterval(btnTimer)
                        }
                        // 给ol绑定点击事件
                        const olEl = container.querySelector('ol')
                        olEl.onclick = _debounce(async function(event) {
                            console.log(event)
                            const targetEvent = event.target
                            // 如果是span,那就拿兄弟
                            const itemName = targetEvent.className
                            if (itemName === 'amazon_download_btn') { 
                                // 拿他兄弟
                                const siblingEl = targetEvent.previousElementSibling
                                // 她兄弟如果datarsc有值,就去下载视频
                                if (siblingEl) {
                                    const url = siblingEl.dataset.videoUrl
                                    prevUrl = url
                                    if (url) {
                                        // 我找到了,然后break出去
                                        downloadAmazonVideo(url, 2)
                                    }
                                }
                            }
                        }, 1000)
                        for (let index = 0; index < lis.length; index++) {
                            const button = document.createElement('span')
                            button.className = 'amazon_download_btn'
                            button.innerText = '下载该视频'
                            lis[index].appendChild(button) 
                        }
                    }, 1500);
               }
            }
        }
        AmazonEl.style.position = "fixed"
        AmazonEl.style.left = '15px'
        AmazonEl.style.top = '50%'
        AmazonEl.innerHTML = `
            <svg class="amazon_svg" style="width: inherit; height: auto" t="1740114360564" class="icon" viewBox="0 0 2048 1024" version="1.1"
                xmlns="http://www.w3.org/2000/svg" p-id="7007" xmlns:xlink="http://www.w3.org/1999/xlink"
                width="400" height="200">
                <path
                    d="M1310.72 286.72h-126.293333V215.04h235.52v64.853333l-119.466667 174.08s47.786667 3.413333 68.266667 10.24c27.306667 6.826667 61.44 23.893333 61.44 23.893334v71.68s-81.92-27.306667-126.293334-27.306667c-54.613333 0-126.293333 27.306667-126.293333 27.306667v-78.506667l133.12-194.56zM310.613333 512l-34.133333-34.133333V283.306667C276.48 242.346667 204.8 204.8 150.186667 204.8 71.68 204.8 10.24 256 6.826667 320.853333h81.92c6.826667-27.306667 27.306667-44.373333 54.613333-44.373333s47.786667 17.066667 47.786667 44.373333v30.72h-68.266667c-17.066667 0-34.133333 3.413333-47.786667 10.24-61.44 27.306667-88.746667 92.16-64.853333 146.773334s92.16 78.506667 153.6 51.2c17.066667-6.826667 30.72-17.066667 40.96-30.72l44.373333 44.373333L310.613333 512z m-204.8-17.066667c-20.48-20.48-13.653333-54.613333 10.24-78.506666 6.826667-6.826667 17.066667-13.653333 23.893334-13.653334h51.2V477.866667l-6.826667 6.826666c-23.893333 23.893333-58.026667 27.306667-78.506667 10.24zM1143.466667 512l-34.133334-34.133333V283.306667c0-40.96-71.68-78.506667-126.293333-78.506667-78.506667 0-139.946667 51.2-143.36 116.053333H921.6c6.826667-27.306667 27.306667-44.373333 54.613333-44.373333s47.786667 17.066667 47.786667 44.373333v30.72h-71.68c-17.066667 0-34.133333 3.413333-47.786667 10.24-61.44 27.306667-88.746667 92.16-64.853333 146.773334s92.16 78.506667 153.6 51.2c17.066667-6.826667 30.72-17.066667 40.96-30.72l44.373333 44.373333 64.853334-61.44z m-201.386667-17.066667c-20.48-20.48-13.653333-54.613333 10.24-78.506666 6.826667-6.826667 17.066667-13.653333 23.893333-13.653334h51.2V477.866667l-3.413333 3.413333c-27.306667 27.306667-61.44 30.72-81.92 13.653333z"
                    fill="#221E1F" p-id="7008"></path>
                <path d="M774.826667 300.373333v0z" fill="#221E1F" p-id="7009"></path>
                <path
                    d="M686.08 204.8c-37.546667 0-68.266667 23.893333-81.92 64.853333-17.066667-40.96-47.786667-64.853333-85.333333-64.853333s-68.266667 30.72-81.92 71.68V215.04h-85.333334v358.4h85.333334V341.333333c0-30.72 23.893333-51.2 51.2-51.2 13.653333 0 37.546667 23.893333 37.546666 37.546667v242.346667h85.333334v-191.146667-47.786667c3.413333-20.48 27.306667-40.96 47.786666-37.546666 17.066667 0 37.546667 23.893333 37.546667 40.96v238.933333h85.333333v-273.066667C768 245.76 744.106667 204.8 686.08 204.8z"
                    fill="#221E1F" p-id="7010"></path>
                <path d="M774.826667 303.786667v13.653333c3.413333-3.413333 3.413333-10.24 0-13.653333z"
                    fill="#221E1F" p-id="7011"></path>
                <path
                    d="M1962.666667 204.8c-37.546667 0-68.266667 30.72-81.92 71.68V215.04h-85.333334v358.4h85.333334V341.333333c0-30.72 23.893333-51.2 51.2-51.2 13.653333 0 37.546667 23.893333 37.546666 37.546667v242.346667H2048V286.72C2048 238.933333 2000.213333 204.8 1962.666667 204.8zM1604.266667 204.8c-81.92 0-146.773333 81.92-146.773334 187.733333 0 102.4 64.853333 187.733333 146.773334 187.733334s146.773333-81.92 146.773333-187.733334c-3.413333-102.4-68.266667-187.733333-146.773333-187.733333z m44.373333 252.586667c0 23.893333-20.48 44.373333-44.373333 44.373333h-3.413334c-23.893333 0-44.373333-20.48-44.373333-44.373333V324.266667c0-23.893333 20.48-44.373333 44.373333-44.373334h3.413334c23.893333 0 44.373333 20.48 44.373333 44.373334v133.12z"
                    fill="#221E1F" p-id="7012"></path>
                <path
                    d="M310.613333 604.16s225.28 143.36 525.653334 146.773333c300.373333 3.413333 409.6-85.333333 436.906666-92.16s20.48 23.893333 0 40.96-276.48 150.186667-477.866666 129.706667-389.12-102.4-488.106667-201.386667c-30.72-34.133333 3.413333-23.893333 3.413333-23.893333z"
                    fill="#F59328" p-id="7013"></path>
                <path
                    d="M1191.253333 631.466667s122.88-23.893333 133.12 0c10.24 23.893333-23.893333 112.64-37.546666 136.533333-10.24 17.066667 13.653333 20.48 23.893333 10.24 10.24-13.653333 68.266667-85.333333 61.44-163.84 0-27.306667-20.48-34.133333-58.026667-34.133333-23.893333 0-105.813333 17.066667-136.533333 34.133333-3.413333 3.413333-6.826667 20.48 13.653333 17.066667z"
                    fill="#F59328" p-id="7014"></path>
            </svg>
            <ul class="amazon_menu_ul">
                <li class="amazon_menu_ul_li">
                    <div class="down_180">下载商品图</div>
                    <div class="down_video">下载全部视频</div>
                    <div class="down_pic">下载所有图片</div>
                </li>
            </ul>
        `
        AmazonEl.className = 'amazon_fix_logo'
        document.body.appendChild(AmazonEl)
        document.querySelector('.amazon_svg').oncontextmenu = function(e) {
            e.preventDefault()
            // 我被触发了
            const menuList = document.querySelector('.amazon_menu_ul')
            menuList.style.display = 'block'
            // 给整个网页添加点击监听
            document.onclick = function(e) {
                menuList.style.display = 'none'
                // 把监听给关了
                document.onclick = null
            }
        }
        const allOption = document.querySelectorAll('.amazon_menu_ul_li div')
        for (let index = 0; index < allOption.length; index++) {
            const each_menu_item = allOption[index]
            each_menu_item.onclick = async function() {
                const item_className = this.className
                switch(item_className) {
                    case 'down_180':
                        chrome.runtime.sendMessage({
                            message: 'download_TEMU_Pic',
                            size: '180',
                            downloadList: downloadList
                        })
                        break;
                    case 'down_video':
                        // 这个地方要看看有没有视频,没有的话,可下载的视频就不显示了
                        // document.querySelector('._dnNlL_vseVideoDataItem_2A7tm')
                        const container = document.getElementById('div-relatedvideos')
                        const olEl = container.querySelectorAll('ol li')
                        if (!olEl.length) {
                            alert('请点击视频播放后再点击下载视频')
                            return
                        }
                        let currentDownloadUrl = null
                        for (let index = 0; index < olEl.length; index++) {
                            const divEl = olEl[index].querySelector('div')
                            // 拿到olEl里面的第一条
                            currentDownloadUrl = divEl.dataset.videoUrl   
                            await downloadAmazonVideo(currentDownloadUrl, 2)
                            await delayFn(2000)
                        }
                        break;
                    case 'down_pic':
                        // 这个地方拿到所有的src
                        let picDivForScript = document.getElementById('imageBlockVariations_feature_div')
                        let picScript = picDivForScript.querySelector('script')
                        let downloadUrl = picScript.innerText.match(/"hiRes":"(.*?)\.jpg"/g)
                        if (downloadUrl) {
                            //  downloadUrl = Array.from(picScript.innerText.match(/"hiRes":"(.*?)\.jpg"/g))
                        } else {
                            picDivForScript = document.getElementById('imageBlock_feature_div')
                            picScript = picDivForScript.querySelector('#imageBlock')
                            //  下个元素
                            let nextsiblingEl = picScript.nextElementSibling
                            downloadUrl = Array.from(nextsiblingEl.innerText.match(/"hiRes":"(.*?)\.jpg"/g))
                        }                        
                        // 给background修改
                        chrome.runtime.sendMessage({
                            message: 'downloadAmazonPic',
                            picList: downloadUrl
                        })
                    default:
                        console.log('以外操作')
                }
            }
        }
    } else if (/aliexpress\.com\/item/.test(location.href)) {
        let downloadAliExpressList = []
        // // 插入一个TEMUlogo进来
        const expressEl = document.createElement('div')
        let btnTimer = null
        expressEl.style.position = "fixed"
        expressEl.classList.add('express_fix_logo')
        expressEl.style.left = '15px'
        expressEl.style.top = '50%'
        expressEl.style.width = '100px'
        expressEl.innerHTML = `
            <svg t="1740386653878" class="express_svg" style="width: inherit; height: auto" viewBox="0 0 5605 1024" version="1.1"
                xmlns="http://www.w3.org/2000/svg" p-id="6065" xmlns:xlink="http://www.w3.org/1999/xlink"
                width="1094.7265625" height="200">
                <path
                    d="M268.934454 506.126019l71.356556-306.121783L425.013447 506.072124H268.934454v0.053895zM445.924583 0.001078H269.904558L0 812.193907h150.204473a34.869858 34.869858 0 0 0 33.414702-24.899342l42.415113-139.91059h235.735331l36.055541 138.563223a34.869858 34.869858 0 0 0 33.791965 26.246709h172.462976L457.673624 0.001078h-11.695146zM751.076262 812.193907h176.07392V0.001078h-176.07392v812.192829z m293.402639 0h175.96613V211.807171H1044.478901v600.386736zM1177.113708 0.001078h-89.303485a43.439112 43.439112 0 0 0-43.331322 43.493007V121.264108c0 24.037027 19.402085 43.493007 43.331322 43.493007h89.303485a43.385217 43.385217 0 0 0 43.331323-43.493007V43.494085A43.439112 43.439112 0 0 0 1177.113708 0.001078"
                    fill="#FF7E00" p-id="6066"></path>
                <path
                    d="M3062.996355 153.008075h-152.57584l-91.78264 152.198576-72.542239-152.198576h-199.464211l170.307189 318.894822-193.80527 340.29101h164.32488l109.028938-191.433904 102.184313 191.433904h187.715171l-189.655379-367.453929 166.265088-291.731903z m-739.327222 0H1547.208477l-11.641251-37.726276a46.29553 46.29553 0 0 0-44.193638-32.875755h-141.796903l223.016186 729.733968H2312.620724c38.480802 0 69.631927-31.258914 69.631926-69.9014v-59.553621H1709.000306l-122.340924-400.221895h708.283886l-31.151125 140.395642a46.079951 46.079951 0 0 1-45.002058 36.16333h-458.535938l35.247121 117.705982h538.946801c48.505212 0 90.543063-33.791964 101.052525-81.273178l75.829815-342.446797h-187.715171zM1631.230283 835.638093c-51.900577 0-93.884533 42.199535-93.884533 94.207901 0 51.954472 42.03785 94.154006 93.884533 94.154006 51.900577 0 93.884533-42.199535 93.884533-94.207901 0-51.954472-42.03785-94.154006-93.884533-94.154006m645.442689 0c-51.846682 0-93.830638 42.199535-93.830638 94.207901 0 51.954472 42.03785 94.154006 93.830638 94.154006 51.900577 0 93.884533-42.199535 93.884533-94.207901 0-51.954472-41.983956-94.154006-93.884533-94.154006m1185.3057-294.264953c0 38.80417-31.366704 70.278663-70.170874 70.278662h-12.287987a70.332558 70.332558 0 0 1-70.063084-70.278662V329.243679c0-38.911959 31.366704-70.332558 70.063084-70.332558h12.287987c38.80417 0 70.170874 31.420599 70.170874 70.332558v212.129461z m-17.569666-376.56213a192.404008 192.404008 0 0 0-135.006174 55.080363V153.008075H3133.436702v659.131937h176.020025V651.048814a192.511797 192.511797 0 0 0 135.006174 55.188152A193.859164 193.859164 0 0 0 3637.890907 512.000539V359.101331a193.859164 193.859164 0 0 0-193.58969-194.236427l0.107789-0.053894z m416.605877 75.021394V153.008075h-176.07392v659.131937h176.07392V472.28016c23.336396-154.354364 164.270985-130.910178 164.270985-130.910178V153.061969c-86.71654 0-137.862592 49.151948-164.270985 86.770435m528.167865 172.139609H4212.947144v-52.816787c0-48.82858 39.450906-88.279486 88.063908-88.279486 48.613001 0 88.063907 39.450906 88.063907 88.279486v52.870681z m-93.992322-247.107109a258.586675 258.586675 0 0 0-258.155518 258.910044v129.455021a258.586675 258.586675 0 0 0 258.155518 259.017833c130.694599 0 234.711332-70.655926 255.730257-223.662923h-150.096684s0 105.903046-99.705158 105.903047a88.171697 88.171697 0 0 1-88.063907-88.279486V506.072124h340.344905V423.721053a258.586675 258.586675 0 0 0-258.263308-258.910043h0.053895zM4928.93797 435.470093c-117.382613-35.35491-164.270985-58.906885-164.270985-105.956941 0-35.35491 23.390291-58.799096 70.386452-58.799096 58.745201 0 82.135492 82.297177 82.135492 82.297177l140.826799-35.301016s-46.888372-164.756037-222.962291-164.756037c-152.575839 0-234.711332 94.207901-234.711332 188.308012 0 94.207901 46.888372 153.006997 152.575839 188.361907 116.19693 38.80417 152.521945 58.852991 152.521945 105.903047 0 29.426495-23.444186 58.852991-82.135492 58.85299-82.135492 0-93.884533-94.154006-93.884533-94.154006l-140.826799 23.551975c0 70.602031 58.745201 188.361907 222.962291 188.361907 176.07392 0 258.155518-105.956941 258.155518-200.110947 0-58.906885-23.444186-141.311851-140.772904-176.612866m528.11397 0.053894c-117.382613-35.35491-164.378774-58.906885-164.378774-105.956941 0-35.35491 23.498081-58.799096 70.494241-58.799096 58.745201 0 82.135492 82.297177 82.135493 82.297177l140.826799-35.301016s-46.996161-164.756037-222.962292-164.756037c-152.575839 0-234.711332 94.207901-234.711332 188.308012 0 94.207901 46.888372 153.006997 152.521945 188.361907 116.250825 38.80417 152.521945 58.852991 152.521945 105.903047 0 29.426495-23.444186 58.852991-82.081598 58.85299-82.135492 0-93.884533-94.154006-93.884533-94.154006l-140.826799 23.551975c0 70.602031 58.745201 188.361907 222.962292 188.361907 176.07392 0 258.155518-105.956941 258.155517-200.110947 0-58.906885-23.444186-141.311851-140.772904-176.612866"
                    fill="#CF0014" p-id="6067"></path>
            </svg>
            <ul class="express_menu_ul">
                <li class="express_menu_ul_li">
                    <div class="down_960">下载商品图</div>
                    <div class="down_video">下载视频</div>
                </li>
            </ul>
        `
        document.body.appendChild(expressEl)
        setTimeout(() => {
            document.querySelector('.express_svg').oncontextmenu = function(e) {
                e.preventDefault()
                // 我被触发了
                const menuList = document.querySelector('.express_menu_ul')
                menuList.style.display = 'block'
                // 给整个网页添加点击监听
                document.onclick = function(e) {
                    menuList.style.display = 'none'
                    // 把监听给关了
                    document.onclick = null
                }
            }
            const allOption = document.querySelectorAll('.express_menu_ul_li div')
            for (let index = 0; index < allOption.length; index++) {
                const each_menu_item = allOption[index]
                each_menu_item.onclick = async function() {
                    const item_className = this.className
                    switch(item_className) {
                        case 'down_960':
                            let downloadAliExpressList = []
                            // 可以下载了,先拿图地址
                            const picEls = document.querySelectorAll('.slider--item--FefNjlj')
                            if (picEls.length) {
                                // 郑敏有,那么就替换下里面的src,
                                for (let index2 = 0; index2 < picEls.length; index2++) {
                                    let imgEl = picEls[index2].querySelector('img')
                                    let url = imgEl.src.replace(/220x220/, '960x960')
                                    downloadAliExpressList = downloadAliExpressList.concat(url)
                                }
                                // 发给background
                                chrome.runtime.sendMessage({
                                    message: 'downloadAliExpressPic',
                                    picList: downloadAliExpressList
                                })
                            }
                            break;
                        default:
                            console.log('以外操作')
                    }
                }
            }   
        });
    }
    // 将默认的鼠标移除掉
    // document.documentElement.style.cursor = "none"
    document.documentElement.style.pointEvent = "none"
    document.documentElement.querySelector('body').appendChild(dot_container)
    document.documentElement.querySelector('body').appendChild(block_container)

    // 我要把我的css先引入到页面中
    injectFn(chrome.runtime.getURL('/css/zx.css'), "head", "style")

    // 发个事件给background.js
    chrome.runtime.sendMessage({
        message: 'getRate'
    })
    // 接收background.js的事件
    chrome.runtime.onMessage.addListener(async (res, render, sendResponse) => {
        // 这个地方是去拿汇率
        if(res.type === 'rate') {
            // 汇率拿到了
            console.log('这是汇率信息', res)
            insertRate(res.data.price, res.data.Title)
            chrome.runtime.sendMessage({
                message: "getId",
                data: {
                    id: localStorage.getItem('agentseller-mall-info-id') ?? localStorage.getItem('mall-info-id'),
                    cookie: document.cookie
                }
            })
            // 生成一个右侧的小浮动可以看汇率
        }
        // 这个事件只是用来提示用户是添加成功还是失败,不进行操作
        else if (res.type === 'addAccount') {
            if(res.data.statu !== 200) {
                // 证明添加账号失败,那么就要告诉用户哪个号有问题要删掉,重新添加
                alert(res.data.msg)
            } else {
                // 这个地方要发消息给我的后台,后台去拿
                // 添加成功
                alert(res.data.msg)
            }
        }

        // 这个事件是监听我是不是拿到所有的库存信息
        else if (res.type === 'StockInfo') {
            console.log('这是当前保存的库存信息', res.data.data)
            // 在这个地方再格式化吧,生成一个全新的对象,这个地方要进行SKU的配对我看看哈
            const SortObject = {}
            // 设置正则表达式,判断,要循环
            for (let index = 0; index < res.data.data.length; index++) {
                const element = res.data.data[index];
                // SKU就俩种格式嘛 要么就xx-yy-zz 要么就xxxxxxx
                const reg = /[A-Za-z0-9!_]+(@)?(?:-[A-Za-z0-9@!_]+(?:\s(?=.*[a-zA-Z]+)[a-zA-Z0-9]+)?)+/
                // 拿到当前的数组,如果不符合就是null
                const itemSku = reg.exec(element.ItemName)
                if (itemSku) {
                    // 符合
                    // 先拿我当前格式完成的key ['XLW-128-BLACK', 'XLW-128']
                    const SortList = Object.keys(SortObject)
                    // 默认里面是没有存储过这个Sku的
                    let hasSku = false
                    // 当前的SKU
                    const currentSku = itemSku[0].replace(/@/, '')
                    for (let SortList_index = 0; SortList_index < SortList.length; SortList_index++) { 
                        // 当前拿到的就是一个SKU而已
                        const save_Sku = SortList[SortList_index]
                        const reg = new RegExp(`${save_Sku}(?![a-zA-Z])`, 'i')
                        // 拿到验证结果,如果在currentSku里面能匹配上,那证明我是保存过的
                        if(reg.test(currentSku)) {
                            // 证明是保存过的,开始循环,看看我当前这个SKU的仓库是不是在SortList里面有
                            for (let index_subItem = 0; index_subItem < element.subItemList.length; index_subItem++) { 
                                // 拿仓库名称
                                const currentHouseItem = element.subItemList[index_subItem]
                                // 定义当前的仓库是不是是存在的
                                let isExact = false
                                // 在SortList里面的list找
                                for(let index_warehouse = 0; index_warehouse < SortObject[save_Sku].warehouseList.length; index_warehouse++ ) { 
                                    // 在这里面去找,是不是有对得上的
                                    const saveHouseItem = SortObject[save_Sku].warehouseList[index_warehouse]
                                    if (currentHouseItem.warehouseName == saveHouseItem.warehouseName) {
                                        // 那么就直接加入到仓库里
                                        saveHouseItem.omsAvailableQuantity += currentHouseItem.omsAvailableQuantity
                                        // 告诉仓库已经存在
                                        isExact = true
                                        // 直接退出循环
                                        break;
                                    }
                                 }
                                 // 如果仓库不存在就要加入进去
                                 if (!isExact) {
                                    SortObject[save_Sku].warehouseList = SortObject[save_Sku].warehouseList.concat({
                                        warehouseName: currentHouseItem.warehouseName,
                                        omsAvailableQuantity: currentHouseItem.omsAvailableQuantity
                                    })
                                    SortObject[save_Sku].goodTotalNum += currentHouseItem.omsAvailableQuantity * 1
                                 }
                            }
                            // 在这个地方要先把hasSku修改成有
                            hasSku = true
                            // 退出来,把仓库那些都搞定了
                            break;
                        }
                    }
                    if (!hasSku) {
                        // 证明我对象里面没有,那么就要初始化
                        SortObject[currentSku] = {
                            warehouseList: element.subItemList,
                            goodTotalNum: element.ItemStock,
                            goodName: element.ItemName.replace('@', '')
                        }
                    }
                } else {
                    // 这个地方要去判断是不是XJJ123456这种情况
                    const reg2 = /[A-Za-z0-9@!_]{8,}/
                    const itemSku2 = reg2.exec(element.ItemName)    
                    const SortList = Object.keys(SortObject)               
                    const currentSku = itemSku2 ? itemSku2[0].replace(/@/, '') : null
                    if (currentSku) {
                        let hasSku = false
                        // 如果存在,证明是XJJ123456这种情况
                        for (let SortList_index = 0; SortList_index < SortList.length; SortList_index++) { 
                            // 当前拿到的就是一个SKU而已,这个地方直接就是把@都去掉
                            const save_Sku = SortList[SortList_index]
                            const reg = new RegExp(`${save_Sku}(?![a-zA-Z])`, 'i')
                            // 拿到验证结果,如果在currentSku里面能匹配上,那证明我是保存过的
                            if(reg.test(currentSku)) {
                                // 证明是保存过的,开始循环,看看我当前这个SKU的仓库是不是在SortList里面有
                                for (let index_subItem = 0; index_subItem < element.subItemList.length; index_subItem++) { 
                                    // 拿仓库名称
                                    const currentHouseItem = element.subItemList[index_subItem]
                                    // 定义当前的仓库是不是是存在的
                                    let isExact = false
                                    // 在SortList里面的list找
                                    for(let index_warehouse = 0; index_warehouse < SortObject[save_Sku].warehouseList.length; index_warehouse++ ) { 
                                        // 在这里面去找,是不是有对得上的
                                        const saveHouseItem = SortObject[save_Sku].warehouseList[index_warehouse]
                                        if (currentHouseItem.warehouseName == saveHouseItem.warehouseName) {
                                            // 那么就直接加入到仓库里
                                            saveHouseItem.omsAvailableQuantity += currentHouseItem.omsAvailableQuantity
                                            // 告诉仓库已经存在
                                            isExact = true
                                            // 直接退出循环
                                            break;
                                        }
                                     }
                                    // 如果仓库不存在就要加入进去
                                    if (!isExact) {
                                        SortObject[save_Sku].warehouseList = SortObject[save_Sku].warehouseList.concat({
                                            warehouseName: currentHouseItem.warehouseName,
                                            omsAvailableQuantity: currentHouseItem.omsAvailableQuantity
                                        })
                                        SortObject[save_Sku].goodTotalNum += currentHouseItem.omsAvailableQuantity * 1
                                    }
                                }
                                hasSku = true
                                break;
                            }
                        }
                        if (!hasSku) {
                            // 证明我对象里面没有,那么就要初始化
                            SortObject[currentSku] = {
                                warehouseList: element.subItemList,
                                goodTotalNum: element.ItemStock,
                                goodName: element.ItemName.replace(/@/,'')
                            }
                        }
                    } else {
                        // 证明名称里面没有我要的,那么就去SKU里面拿,这个地方直接匹
                        const finalSku = element.ItemSku.replace(/@/, '')
                        // 有咩有
                        let hasSku = false
                        for (let SortList_index = 0; SortList_index < SortList.length; SortList_index++) { 
                            // 当前拿到的就是一个SKU而已
                            const save_Sku = SortList[SortList_index]
                            const reg = new RegExp(`${save_Sku}(?![a-zA-Z])`, 'i')
                            // 拿到验证结果,如果在currentSku里面能匹配上,那证明我是保存过的
                            if(reg.test(finalSku)) {
                                // 证明是保存过的,开始循环,看看我当前这个SKU的仓库是不是在SortList里面有
                                for (let index_subItem = 0; index_subItem < element.subItemList.length; index_subItem++) { 
                                    // 拿仓库名称
                                    const currentHouseItem = element.subItemList[index_subItem]
                                    // 定义当前的仓库是不是是存在的
                                    let isExact = false
                                    // 在SortList里面的list找
                                    for(let index_warehouse = 0; index_warehouse < SortObject[save_Sku].warehouseList.length; index_warehouse++ ) { 
                                        // 在这里面去找,是不是有对得上的
                                        const saveHouseItem = SortObject[save_Sku].warehouseList[index_warehouse]
                                        if (currentHouseItem.warehouseName == saveHouseItem.warehouseName) {
                                            // 那么就直接加入到仓库里
                                            saveHouseItem.omsAvailableQuantity += currentHouseItem.omsAvailableQuantity
                                            // 告诉仓库已经存在
                                            isExact = true
                                            // 直接退出循环
                                            break;
                                        }
                                     }
                                     // 如果仓库不存在就要加入进去
                                     if (!isExact) {
                                        SortObject[save_Sku].warehouseList = SortObject[save_Sku].warehouseList.concat({
                                            warehouseName: currentHouseItem.warehouseName,
                                            omsAvailableQuantity: currentHouseItem.omsAvailableQuantity
                                        })
                                        SortObject[save_Sku].goodTotalNum += currentHouseItem.omsAvailableQuantity * 1
                                     }
                                }
                                // 在这个地方要先把hasSku修改成有
                                hasSku = true 
                                break;
                            }
                        }
                        if (!hasSku) {
                            // 证明我对象里面没有,那么就要初始化
                            SortObject[finalSku] = {
                                warehouseList: element.subItemList,
                                goodTotalNum: element.ItemStock,
                                goodName: element.ItemName.replace(/@/,'')
                            }
                        }
                    }
                }
            }
            console.log(SortObject, Object.keys(SortObject))
            // 在这个地方生成一个输入框和一个展示框给查看数据
            const dialogEl = document.createElement('div')
            dialogEl.classList.add('dialog_attr')
            dialogEl.innerHTML = `
                <div class="stock_close">
                    <label for="changdu">
                        <span>長度</span>
                    </label>
                    <input id="changdu" placeholder="请输入长度" value="260" />
                    <label for="kuangdu">
                        <span>寬度</span>
                    </label>
                    <input id="changdu" placeholder="请输入宽度" value="260" />
                    <div class="svg_container">
                        <svg style="width: inherit; height: auto" t="1740324638854" class="icon" viewBox="0 0 1024 1024" version="1.1"
                            xmlns="http://www.w3.org/2000/svg" p-id="1466" xmlns:xlink="http://www.w3.org/1999/xlink"
                            width="200" height="200">
                            <path
                                d="M846.005097 957.24155c-28.587082 0-57.174164-10.911514-78.996169-32.733519L96.632851 254.131955c-43.644009-43.644009-43.644009-114.348328 0-157.992337s114.348328-43.644009 157.992337 0L925.001265 766.515694c43.644009 43.644009 43.644009 114.348328 0 157.992337C903.17926 946.330036 874.592179 957.24155 846.005097 957.24155z"
                                fill="#FF4400" p-id="1467"></path>
                            <path
                                d="M175.62902 957.24155c-28.587082 0-57.174164-10.911514-78.996169-32.733519-43.644009-43.644009-43.644009-114.348328 0-157.992337L767.008928 96.139617c43.644009-43.644009 114.348328-43.644009 157.992337 0s43.644009 114.348328 0 157.992337L254.625188 924.508032C232.803183 946.330036 204.216101 957.24155 175.62902 957.24155z"
                                fill="#FF4400" p-id="1468"></path>
                        </svg>
                    </div>
                </div>
                <div class="search_container">
                    <div class="search">
                        <input id="search_Stock" placeholder="请输入关键词" />
                        <span class="line"></span>
                    </div>
                    </div>
                    <div class="visible tip">暂无数据</div>
                    <ul class="hide tableEl"></ul>
                </div>
            `
            // 插入网页
            document.body.appendChild(dialogEl)
            // 给他加一个点击按下和移动以及松开的事件
            let moveX, moveY, endX=0,endY=0, isDown
            // document.querySelector('.dialog_attr').onmousedown = function(e) {
            //     // 键盘按下时的位置
            //     startX = e.clientX
            //     startY = e.clientY
            //     isDown = true
            // }
            // document.onmousemove = function(e) {
            //     if(isDown) {
            //         // 计算出我要移动多少
            //         moveX = e.clientX - startX + endX
            //         moveY = e.clientY - startY + endY
            //         this.style.transform = `translate(${moveX}px, ${moveY}px)` 
            //     }
            // }
            // document.onmouseup = function(e) {
            //     isDown = false
            //     this.style.transform = `translate(${moveX}px, ${moveY}px)`
            //     endX = moveX
            //     endY = moveY
            // }
            // 监听,settimeout下
            setTimeout(() => {
                document.getElementById('search_Stock').addEventListener('input', _debounce(function() {
                    // 拿到我输入的值
                    const currentValue = this.value?.trim()
                    if (currentValue) {
                        // 有值,那么就显示数据
                        document.querySelector('ul.tableEl').classList.remove('hide')
                        document.querySelector('div.tip').classList.remove('visible')
                        // 有值就要循环了嗷
                        const reg = new RegExp(`${currentValue}`, 'i')
                        // 存储起来
                        let showList = []
                        for (const key in SortObject) {
                             if (reg.test(key)) {
                                // 退一个对象进去
                                showList = showList.concat(SortObject[key])
                             }
                        }
                        console.log(showList)
                        // 如果有筛选出来,那么就全部显示到表格里面
                        if (showList.length) {
                            // 组成一个ul和li吧
                            document.querySelector('ul.tableEl').innerHTML = ''
                            for (let index = 0; index < showList.length; index++) {
                                const item = showList[index]
                                let str = `
                                    <ul>
                                        <li class="skuName">${item.goodName}</li>
                                    `
                                for (let subIndex = 0; subIndex < item.warehouseList.length; subIndex++) {
                                    const currentWareHouse = item.warehouseList[subIndex]
                                    str += `
                                        <li><span class="warehouseName"><span style="font-weight: 700">仓库名称 </span>${currentWareHouse.warehouseName}: </span><span style="font-weight: 700">库存 </span><span class="currentNum" style="color: blue">${currentWareHouse.omsAvailableQuantity}</span></li>
                                    `
                                }
                                // 出来再包起来
                                str += `
                                    <li class="allNum"><span style="font-weight: 700; color: red">总剩余库存 </span>${item.goodTotalNum}</li>
                                    </ul>
                                `
                                document.querySelector('ul.tableEl').innerHTML += str
                            }
                        }
                    } else {
                        // 咩有有值,那么就隐藏数据
                        document.querySelector('ul.tableEl').classList.add('hide')
                        document.querySelector('div.tip').classList.add('visible')
                    }
                    console.log(this)
                }))
                document.querySelector('.svg_container').addEventListener('click', function() {
                    // 不显示了
                    document.querySelector('.dialog_attr').remove()
                })
            });
        }

        // 这个事件是拿到我产品的重量什么的
        else if (res.type === 'getWeight') {
            console.log('我进来了', res)
            let str = `
            <div class="table-container">
                <table>
                    <caption class="caption-style">产品详情表</caption>
                    <thead>
                        <tr class="header-row">
                            <th class="sku-col">序号</th>
                            <th class="length-col">长/cm</th>
                            <th class="width-col">宽/cm</th>
                            <th class="height-col">高/cm</th>
                            <th class="weight-col">重量/g</th>
                            <th class="quantity-col">数量</th>
                        </tr>
                    </thead>
                    <tbody>
            `
            let orderList = res.data.goodNums

            for (let index = 0; index < orderList.length; index++) {
                let good = orderList[index]
                str += `
                        <tr class="data-row">
                             <td class="sku-col" style="font-size: 12px">${good.itemHuoHao}</td>
                             <td class="length-col">${good.property.inputLen}</td>
                             <td class="width-col">${good.property.inputWidth}</td>
                             <td class="height-col">${good.property.inputHeight}</td>
                             <td class="weight-col">${good.itemWeight.inputValue}</td>
                             <td class="quantity-col"><input class="numIpt" placeholder="请输入数量" /></td>
                         </tr>
                    `
            }
            str += `
            </tbody>
            </table>
            </div>`
            // 插入到页面中
            const SizeEl = document.createElement('div')
            SizeEl.classList.add('sizeElement')
            SizeEl.innerHTML = str
            document.body.appendChild(SizeEl)
        }

        // 这个地方是给页面加一个按钮的,然后这个按钮可以触发回调
        else if (res.type === 'hasOrderData') {
            // 直接添加一个按钮
            console.log('我来了')
            let btnEl = document.createElement('div')
            btnEl.classList.add('download-order')
            btnEl.innerHTML = '显示商品信息'
            document.body.appendChild(btnEl)
            btnEl.onclick = () => {
                // 这地方 要触发一个自定义事件
                chrome.runtime.sendMessage({
                    message: 'getSendOrderData'
                })
            }
        }

        // 下载面单,这个方式下载面单是通过插入a的方式,而不是通过调用downloads的谷歌api进行下载
        // 
        //     <!-- 第二行 -->
        //     
        // 
        // download的API只能在background里面使用,我测试下来是这样子的
        // else if (res.type === 'downloadOrder') {
        //     console.log('我来了就对了', res.data)
        //     if (res.data.length) {
        //         // 在这里循环下载
        //         for (let index = 0; index < res.data.length; index++) {
        //             const aEl = document.createElement('a')
        //             aEl.href = res.data[index].url
        //             aEl.download = res.data[index].fileName
        //             document.body.appendChild(aEl)
        //             aEl.click()
        //             await delayFn()
        //         }
        //     }
        // }
    })

    
    // 这个地方是真正去发消息的地方
    async function downloadAmazonVideo(currentDownloadUrl,Resolution) {
        // 证明拿到了
        let tsFileList = []
        let downFileList = []
        // 我找到了,然后break出去
        const u3m8Url  = currentDownloadUrl
        let baseURL = u3m8Url.replace(/\/default.*/, '')
        baseURL = baseURL.replace(/\/embedded.*/, '')
        async function download_fileUrl(filePath) {
            const result = await fetch(filePath).then(res  => res.text())
            // 这个地方要正则下
            let  reg = /default\.jobtemplate\.[\w.]+\.m3u8/g
            if (!result.match(reg)) {
                reg = /default\.vertical\.jobtemplate\.[\w.]+\.m3u8/g
            }
            downFileList = Array.from(result.match(reg))
        }
        await download_fileUrl(u3m8Url)
        if (downFileList.length) {
            const tsResult = await fetch(baseURL + '/' + downFileList[Resolution]).then(res  => res.text())
            if (tsResult.length) {
                let reg = /default\.jobtemplate\.[\w.]+\.ts/g
                if (!tsResult.match(reg)) {
                    reg = /default\.vertical\.jobtemplate\.[\w.]+\.ts/g
                }
                tsFileList = Array.from(tsResult.match(reg))
                for (let index = 0; index < tsFileList.length; index++) {
                    tsFileList[index] = baseURL + '/' + tsFileList[index]
                }
            }
            if (tsFileList.length) {
                chrome.runtime.sendMessage({
                    message: 'download_amazon_Video',
                    tsFileList
                })
            }
        }
    }

    // 刚进来的时候就开始验证,如果当前是进入地址为:
    function getCookieByDianXiaoMi() {
        const url = 'https://pcpc.jfwms.net/web/dashboard'
        const currentUrl = location.href
        if(currentUrl == url) {
            // 证明是,那就发送自定义事件,并将当前的Cookie组装好发过去
            chrome.runtime.sendMessage({
                message: 'dianxiaomicookie',
                cookie:  document.cookie
            })
        }
    }
    getCookieByDianXiaoMi()

    // 插入js文件，暂时不用用到这个，这个结合那个网络拦截一起用
    injectFn(chrome.runtime.getURL('/js/zx.js'), "head", "javascript")

    function insertRate(value, title) {
        const node = document.createElement('div')
        node.classList.add('my_rate')
        node.style.position = "fixed"
        node.style.top = "180px"
        node.style.right = "30px"
        node.style.padding = "10px"
        node.style.zIndex = "9999"
        node.style.color = "#000"
        node.innerHTML = `
            <div class="calculate" style="font-size: 16px; border: 1px solid #000; padding: 15px; display: flex; justify-content: center; align-items: center; background-color: rgba(255,255,255,.8);position: absolute;top:0;right:0;transform:scale(0);transition: transform .5s ease; transform-origin: top right;flex-direction: column">
                <p>汇率转换</p>
                <h3 style="font-size: 14px; text-align: center">${title}</h3>
                <input style="font-size: 16px" id="rate" type="text" value=${value} disabled style="font-weight: 700; text-align: center" />
                <input style="font-size: 16px;margin: 10px 0" id="rmb" ype="text" placeholder="请输入人民币" />
                <input style="font-size: 16px" id="result" type="text" value=0 disabled style="font-weight: 700;" />
            </div>
            <span class="close" style="width: 25px;height:25px;padding: 5px;border-radius: 50%; background-color: #000;position:absolute;top:0;right: 0;transform:translate(50%,-50%);cursor:pointer;">
                <svg class="close_icon" style="height: 100%; width: 100%;" t="1738912985706" class="icon" viewBox="0 0 1024 1024" version="1.1"
                    xmlns="http://www.w3.org/2000/svg" p-id="6250" xmlns:xlink="http://www.w3.org/1999/xlink"
                    width="200" height="200">
                    <path
                        d="M872.778827 254.203062l-620.739643 592.59052-109.312046-114.504566 620.739643-592.59052 109.312046 114.504566Z"
                        fill="#d81e06" p-id="6251"></path>
                    <path
                        d="M268.693068 128.199468l592.589813 620.738902-114.505306 109.312753-592.589813-620.738902 114.505306-109.312753Z"
                        fill="#d81e06" p-id="6252"></path>
                </svg>
                <svg class="rate_icon" style="height: 100%; width: 100%;" t="1738912972797" class="icon" viewBox="0 0 1024 1024" version="1.1"
                    xmlns="http://www.w3.org/2000/svg" p-id="5218" xmlns:xlink="http://www.w3.org/1999/xlink"
                    width="200" height="200">
                    <path
                        d="M976 368H768c-25.6 0-48-22.4-48-48s22.4-48 48-48h83.2C774.4 166.4 652.8 96 512 96 281.6 96 96 281.6 96 512c0 25.6-22.4 48-48 48S0 537.6 0 512C0 230.4 230.4 0 512 0c172.8 0 323.2 83.2 416 214.4V128c0-25.6 22.4-48 48-48s48 22.4 48 48v192c0 25.6-22.4 48-48 48M48 656h208c25.6 0 48 22.4 48 48s-22.4 48-48 48h-83.2C246.4 857.6 371.2 928 512 928c230.4 0 416-185.6 416-416 0-25.6 22.4-48 48-48s48 22.4 48 48c0 281.6-230.4 512-512 512-172.8 0-323.2-86.4-416-214.4V896c0 25.6-22.4 48-48 48S0 921.6 0 896V704c0-25.6 22.4-48 48-48m595.2-128c16 0 32-12.8 32-32 0-16-12.8-32-32-32h-96v-16l115.2-121.6c12.8-12.8 12.8-32 0-44.8-12.8-12.8-32-12.8-44.8 0l-99.2 105.6-105.6-105.6c-12.8-12.8-32-12.8-44.8 0-12.8 12.8-12.8 32 0 44.8l115.2 115.2v19.2h-92.8c-16 0-32 16-28.8 32 0 16 12.8 28.8 28.8 28.8h92.8v64h-92.8c-16 0-32 12.8-32 32 0 16 12.8 32 32 32h92.8v92.8c0 16 12.8 32 32 32 16 0 32-12.8 32-32v-92.8h96c16 0 32-12.8 32-32 0-16-12.8-32-32-32h-96v-64l96 6.4z"
                        fill="#6c40eb" p-id="5219"></path>
                </svg>
            </span>
        `
        // 插入页面
        document.body.appendChild(node)
        // 插入之后设置一个监听, 然后使用防抖
        const rmb = document.getElementById('rmb')
        const calculate = document.querySelector('.calculate')
        rmb.addEventListener('input', _debounce(function() {
            // 在这里面要拿到我的input输入,然后拿到值,之后进行计算
            const result = document.getElementById('result')
            const rate = document.getElementById('rate')
            if(rmb.value) {
                // 这个是人民币
                const amount = parseInt(rmb.value)
                // 这个是汇率
                const rateValue = parseFloat(rate.value)
                // 然后进行计算,赋值下结果
                result.value = (amount * rateValue).toFixed(3)
            } else {
                result.value = 0
            }
        }))
        // 当点击关闭按钮的时候,收缩父亲
        document.querySelector('.close .close_icon').onclick = function() {
            document.querySelector('.rate_icon').style.display = 'block'
            this.style.display = 'none'
            calculate.style.transform = 'scale(0)'
        }
        // 点击按钮的时候，释放父亲
        document.querySelector('.close .rate_icon').onclick = function() {
            document.querySelector('.close_icon').style.display = 'block'
            this.style.display = 'none'
            calculate.style.transform = 'scale(1)'
        }
    }


    // -------------------------------------------------------------
    // Shipout针对速卖通的格式化,这个地方要判断一下是不是进入了app/outbound页面
    // 如果刚进来就识别到card-box那么就不用轮训,如果进来没识别到就先查询下是不是当前已经进入对应页面
    let autoInput = null
    let alreadyEnter = false
    let timer = null
    const href = location.href
    // https://oms.shipout.com/o/#/app/outbound/parcel?omsStatus=1
    // 直接查询是否是以oms.shipout/com开头,如果是再轮训
    const reg = /pcpc.jfwms.net.*\/edit/g
    if(reg.test(href)) {
        setIntervalHref()
    }
    /**
     * 根据用户填写的内容进行校准填写
     */
    function format_AliExpress_Address() {
        console.log("有用户要使用店小秘新系统进行发货出库操作")
        // 拿到这部分内容的自动识别的输入框,拿到他的值
        const previousSibling = document.querySelectorAll('.comm_warp')
        const currentSibling = previousSibling[1].querySelector('h4')
        const autoInput_content = document.querySelector('.local_ipt')
        const iptList = currentSibling.nextElementSibling.querySelectorAll('input')
        const allArea = currentSibling.nextElementSibling.querySelectorAll('textarea')
        // 用户输入的自动识别的值
        const input_value = autoInput_content?.value
        console.log('用户黏贴进来的值', input_value.split('\n'))
        const splitArr = input_value.split('\n')
        // 第一个参数就是对应姓名的
        const fileName = splitArr[0]
        // 替换进去
        iptList[0].value = fileName
        // 第二个参数要细分地址
        const location_po = splitArr[1].split(',')
        // const country = location_po[0]
        // 替换进去
        iptList[4].value = 'United States'
        const area = location_po[1]
        // 替换进去
        iptList[5].value = area
        const city = location_po[2]
        // 替换进去
        iptList[6].value = city
        const address = location_po[3]
        // 替换进去
        allArea[0].value = address
        // 第三个参数是邮编
        const postcode = splitArr[2]
        // 替换进去
        iptList[3].value = postcode
        // 第四个参数是电话,1可以省略
        let cellPhone = splitArr[3]
        const reg = /\+?[1 | 99]\s+(.*)/
        cellPhone = cellPhone.match(reg)[1]
        iptList[1].value = cellPhone
    }
    /**
     * 插入校准按钮进行点击
     */
    function addBtn() {
        const format_btn = document.createElement('div')
        const local_ipt = document.createElement('textarea')
        const btn = document.createElement('button')
        format_btn.classList.add('format_btn')
        format_btn.style.padding = '15px'
        format_btn.style.borderRadius = '5px'
        format_btn.style.transition = 'border-radius .3s linear, border-color .3s linear'
        format_btn.style.border = '1px solid #999'
        format_btn.style.position = 'fixed'
        format_btn.style.top = '50%'
        format_btn.style.left = '10px'
        format_btn.style.display = 'flex'
        format_btn.style.alignItems = 'center'
        local_ipt.classList.add('local_ipt')
        btn.textContent = '格式化用户信息'
        // 添加点击事件
        btn.onclick = () => {
            format_AliExpress_Address()
        }
        format_btn.append(local_ipt)
        format_btn.append(btn)
        document.body.appendChild(format_btn)
    }
    /**
     * 动态监听当前是否是还没有进入了那个页面
     */
    function setIntervalHref(add = true) {
        // 先插入可以格式化的按钮
        // add && addBtn()
    }
    // ----------------------------------------------------



    // 设置页面的复制粘贴,相当于直接将他的复制粘贴给修改掉,先监听下是不是网页的copy
    // chrome.runtime.getURL('./zx.js') 这个可以拿到我相对路径下的文件所在位置,然后植入
}

// 设置一个函数用来算我的方框和我的移动点之间的距离
/**
 * 
 * @param {Element} circle1 移动圈
 * @param {Element} circle2 动画圈
 * @param {Element} line  线条
 */
function calculateLine(circle1, circle2, line) {
  const rect1 = circle1.getBoundingClientRect();
  const rect2 = circle2.getBoundingClientRect();

  // 拿到他们的距离之后,求圆心的距离
  // 动画圈圆心
  const x1 =  rect2.left - rect2.width
  const y1 = rect2.top - rect2.height

  // 移动圈圆心
  const x2 = rect1.left - rect1.width
  const y2 = rect1.top - rect1.height


  // 算出第三条边,也就是延伸出来的长度
  const extendWidth = Math.sqrt(((x2-x1)**2)+((y2-y1)**2))
  // 算出旋转角度,这里算出了夹角,要算出俩个方块分别的角度
  const rotateAngle = Math.atan2(y1-y2,x1-x2) * 180 / Math.PI

  setTimeout(() => {
    line.style.width = extendWidth + 'px'
    line.style.transform = 'rotate('+ rotateAngle +'deg)'
  });
}

/**
 * 强制等待
 * @param {number} timeout 延迟毫秒数
 */
async function delayFn(timeout = 1000) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
                resolve()
        }, timeout);
    })
}

function injectFn(filePath, node, type) {
    const typeList = ['style','javascript']
    if(!typeList.includes(type)) return
    let link = null
    if(type === 'style') {
        link = document.createElement('link')
        link.setAttribute('href', filePath)
        link.setAttribute('rel','stylesheet')
    } else {
        link = document.createElement('script')
        link.setAttribute('type', `text/${type}`)
        link.setAttribute('src', filePath)
    }
    const Element = document.querySelector(node)
    
    Element.insertBefore(link, Element.firstChild)
    console.log("植入成功")
}

// 拦截请求，待定吧，先弄点别的，找个地方放我的汇率
// chrome.webRequest.onBeforeRequest.addListener((details) => {
//     console.log('请求详情', details)
// })

// 设置防抖
function _debounce(fn, time = 500) {
    let timer;
    return function(...arg) {
        timer && clearTimeout(timer)
        timer = setTimeout(() => {
            fn.call(this, ...arg)
        }, time)
    }
}

// 节流
function _throttle(fn, dur_time) {
    let timer
    return function(...arg) {
        if (!timer) {
            timer = new Date().getTime()
            // 这个地方调函数
            fn(...arg)
        }
        let currenttimer = new Date().getTime()
        let timed = currenttimer - timer
        if (timed >= dur_time) {
            fn(...arg)
            timer = currenttimer
        }
    }
}
