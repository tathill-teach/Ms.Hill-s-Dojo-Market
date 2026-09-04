/* =========================================
   MS. HILL'S DOJO MART — FIREBASE SCRIPT
   ========================================= */

const firebaseConfig={
apiKey:"AIzaSyA0S-jXeSRLfb2nId7GxvTpbMbfbtgRWK",
authDomain:"ms-hill-dojo-mart.firebaseapp.com",
databaseURL:"https://ms-hill-dojo-mart-default-rtdb.firebaseio.com",
projectId:"ms-hill-dojo-mart",
storageBucket:"ms-hill-dojo-mart.firebasestorage.app",
messagingSenderId:"941732304107",
appId:"1:941732304107:web:2ba766b2e7b61d38765aae",
measurementId:"G-5R98YXJG7G"
};

if(!firebase.apps.length){
    firebase.initializeApp(firebaseConfig);
}

const dojoAuth=firebase.auth();

const FIREBASE_DB_URL=
    firebaseConfig.databaseURL;


/* =========================================
   STUDENTS
========================================= */

const defaultStudents=[

    {
        name:"Lucy Hammer",
        password:["dog","rocket"],
        points:69
    },

    {
        name:"James Selkirk",
        password:["dinosaur","star"],
        points:41
    },

    {
        name:"Jenna Jonson",
        password:["unicorn","rainbow"],
        points:52
    },

    {
        name:"Owen Alspach",
        password:["car","cat"],
        points:51
    },

    {
        name:"Nicholas Luna",
        password:["butterfly","pizza"],
        points:41
    },

    {
        name:"Guhan Aroul",
        password:["dog","star"],
        points:74
    },

    {
        name:"James Leibarth",
        password:["rocket","heart"],
        points:54
    },

    {
        name:"Ruby Rodriguez",
        password:["rainbow","dinosaur"],
        points:63
    },

    {
        name:"Zedek Lobo",
        password:["cat","unicorn"],
        points:50
    },

    {
        name:"Eleanor Pelletier",
        password:["star","butterfly"],
        points:39
    },

    {
        name:"Eli Hamilton",
        password:["pizza","car"],
        points:42
    },

    {
        name:"Eliana Ayala",
        password:["heart","dog"],
        points:51
    },

    {
        name:"Cecilio Puentes",
        password:["rocket","butterfly"],
        points:29
    },

    {
        name:"Elise Arrieta",
        password:["rainbow","cat"],
        points:47
    },

    {
        name:"Casper Kamali",
        password:["dinosaur","heart"],
        points:72
    }

];


/* =========================================
   LOCAL DATA
========================================= */

let savedPoints={};

try{

    savedPoints=
        JSON.parse(
            localStorage.getItem(
                "dojoMarketPoints"
            )||"{}"
        )||{};

}catch(error){

    console.error(error);

}


const students=
    defaultStudents.map(
        (student,index)=>({

            ...student,

            points:
                savedPoints[index]!==undefined
                    ? Number(savedPoints[index])
                    : student.points

        })
    );


let currentStudentIndex=null;

let selectedPasswordIcons=[];

let cartItems=[];

let inventory={};

let loadingData=false;


/* =========================================
   STORE ACCESS
========================================= */

let storeAccess=
    JSON.parse(
        localStorage.getItem(
            "dojoMarketStoreAccess"
        )||"null"
    );


if(!Array.isArray(storeAccess)){

    storeAccess=
        students.map(
            (_,index)=>index
        );

}


/* =========================================
   ORDERS
========================================= */

let studentOrders=
    JSON.parse(
        localStorage.getItem(
            "dojoMarketOrders"
        )||"{}"
    )||{};


let checkoutButton=null;

let receiptScreen=null;


/* =========================================
   SHORTCUTS
========================================= */

const $=
    id=>document.getElementById(id);

const q=
    selector=>document.querySelector(selector);

const qa=
    selector=>document.querySelectorAll(selector);


/* =========================================
   SCREEN ELEMENTS
========================================= */

const welcomeScreen=
    q(".welcome-screen");

const dojoDoors=
    $("dojoDoors");

const dojoDoorButton=
    $("dojoDoorButton");

const studentScreen=
    $("studentScreen");

const homeScreen=
    $("homeScreen");

const loginScreen=
    $("loginScreen");

const shopScreen=
    $("shopScreen");

const teacherDashboard=
    $("teacherDashboard");


/* =========================================
   STUDENT ELEMENTS
========================================= */

const studentButtons=
    qa(".student-bubble");

const pointsNumber=
    q(".points-number");

const passwordIcons=
    qa(".password-icon");

const passwordStatus=
    $("passwordStatus");


/* =========================================
   SHOP ELEMENTS
========================================= */

const shopButton=
    q(".home-buttons button");

const shopBack=
    $("shopBack");

const loginBack=
    $("loginBack");

const homeBack=
    q("#homeScreen .back-button");

const cartButton=
    $("cartButton");

const cartCount=
    $("cartCount");

const cartPanel=
    $("cartPanel");

const cartItemsContainer=
    $("cartItems");

const cartTotal=
    $("cartTotal");

const pointsRemaining=
    $("pointsRemaining");

const closeCart=
    $("closeCart");


/* =========================================
   TEACHER ELEMENTS
========================================= */

const teacherStudentTableBody=
    $("teacherStudentTableBody");

const teacherOrderDetails=
    $("teacherOrderDetails");

const orderDetailsContent=
    $("orderDetailsContent");

const closeOrderDetails=
    $("closeOrderDetails");

const reopenStoreButton=
    $("reopenStore");

const closeTeacherDashboardButton=
    $("closeTeacherDashboard");


/* =========================================
   INVENTORY FIREBASE SERIALIZATION
========================================= */

/*
   Firebase Realtime Database does NOT allow
   . # $ [ ] / inside object keys.

   We therefore NEVER use the treasure name
   as the Firebase key.

   Firebase stores:

   item_0
   item_1
   item_2

   and the treasure name lives safely inside
   the value instead.
*/

function serializeInventory(data){

    const serialized={};

    const items=
        getStoreItems();

    Object.keys(items)
        .forEach(
            (name,index)=>{

                serialized[`item_${index}`]={
                    name:name,
                    quantity:Math.max(
                        0,
                        Number(
                            data[name]??0
                        )
                    )
                };

            }
        );

    return serialized;

}


function decodeInventoryData(data){

    if(
        !data||
        typeof data!=="object"||
        Array.isArray(data)
    ){

        return null;

    }

    const decoded={};

    Object.values(data)
        .forEach(
            record=>{

                if(
                    record&&
                    typeof record==="object"&&
                    !Array.isArray(record)&&
                    typeof record.name==="string"&&
                    record.quantity!==undefined
                ){

                    decoded[
                        record.name
                    ]=
                        Math.max(
                            0,
                            Number(
                                record.quantity
                            )||0
                        );

                }

            }
        );


    /*
       If the database contains an older
       inventory format, support it too.
    */

    if(
        Object.keys(decoded).length===0
    ){

        Object.keys(data)
            .forEach(
                key=>{

                    let name=key;

                    try{

                        name=
                            decodeURIComponent(
                                key
                            );

                    }catch(error){

                        /* Keep the original key. */

                    }


                    const value=
                        data[key];


                    if(
                        typeof value==="number"||
                        typeof value==="string"
                    ){

                        decoded[name]=
                            Math.max(
                                0,
                                Number(value)||0
                            );

                    }

                }
            );

    }


    return decoded;

}


/* =========================================
   FIREBASE GET
========================================= */

async function firebaseGet(path){

    try{

        const response=
            await fetch(
                `${FIREBASE_DB_URL}/${path}.json`
            );


        if(!response.ok){

            throw new Error(
                response.status
            );

        }


        const data=
            await response.json();


        if(path==="inventory"){

            return decodeInventoryData(
                data
            );

        }


        return data;

    }catch(error){

        console.error(
            "Firebase GET error:",
            error
        );

        return null;

    }

}


/* =========================================
   FIREBASE PUT
========================================= */

async function firebasePut(
    path,
    data
){

    try{

        let dataToSave=
            data;


        /*
           IMPORTANT:
           Inventory is stored using safe Firebase
           keys such as item_0, item_1, item_2.

           The actual treasure name is stored
           inside the value, so names like
           "Pokémon Dive Toys" can never break
           the Firebase database key rules.
        */

        if(path==="inventory"){

            dataToSave=
                serializeInventory(
                    data||{}
                );

        }


        const response=
            await fetch(
                `${FIREBASE_DB_URL}/${path}.json`,
                {
                    method:"PUT",

                    headers:{
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify(
                            dataToSave
                        )
                }
            );


        const responseText=
            await response.text();


        if(!response.ok){

            console.error(
                "🔥 Firebase PUT failed:",
                response.status,
                responseText
            );

            return false;

        }


        return true;

    }catch(error){

        console.error(
            "🔥 Firebase PUT error:",
            error
        );

        return false;

    }

}


/* =========================================
   FIREBASE DELETE
========================================= */

async function firebaseDelete(
    path
){

    try{

        const response=
            await fetch(
                `${FIREBASE_DB_URL}/${path}.json`,
                {
                    method:"DELETE"
                }
            );

        if(!response.ok){

            throw new Error(
                response.status
            );

        }

        return true;

    }catch(error){

        console.error(
            "Firebase DELETE error:",
            error
        );

        return false;

    }

}


/* =========================================
   LOCAL SAVE
========================================= */

function saveLocal(){

    try{

        localStorage.setItem(
            "dojoMarketPoints",
            JSON.stringify(
                students.map(
                    student=>
                        Number(student.points)||0
                )
            )
        );

        localStorage.setItem(
            "dojoMarketStoreAccess",
            JSON.stringify(
                storeAccess
            )
        );

        localStorage.setItem(
            "dojoMarketOrders",
            JSON.stringify(
                studentOrders
            )
        );

        localStorage.setItem(
            "dojoMarketInventory",
            JSON.stringify(
                inventory
            )
        );

    }catch(error){

        console.error(
            "Local save error:",
            error
        );

    }

}


/* =========================================
   SCREEN HELPERS
========================================= */

function hideScreen(screen){

    if(!screen)return;

    screen.classList.add(
        "hidden-screen"
    );

    screen.style.display=
        "none";

    screen.style.visibility=
        "hidden";

}


function showScreen(screen){

    if(!screen)return;

    screen.classList.remove(
        "hidden-screen"
    );

    screen.style.display=
        "flex";

    screen.style.visibility=
        "visible";

}


/* =========================================
   STORE ITEM LIST
========================================= */

function getStoreItems(){

    const items={};

    qa(".reward-card")
        .forEach(
            card=>{

                const title=
                    card.querySelector(
                        "h3"
                    );

                const priceText=
                    card.querySelector(
                        "p"
                    );

                if(
                    !title||
                    !priceText
                ){

                    return;

                }

                const name=
                    title.textContent.trim();

                const match=
                    priceText.textContent.match(
                        /\d+/
                    );

                if(!match){

                    return;

                }

                items[name]={

                    name:name,

                    price:
                        Number(match[0])

                };

            }
        );

    return items;

}


/* =========================================
   DIVE TOY CHECK
========================================= */

function isDiveToy(name){

    return name
        .toLowerCase()
        .includes(
            "dive toys"
        );

}


/* =========================================
   MAKE SURE INVENTORY EXISTS
========================================= */

function ensureInventory(){

    const items=
        getStoreItems();

    Object.keys(items)
        .forEach(
            name=>{

                if(
                    inventory[name]===
                    undefined
                ){

                    inventory[name]=
                        isDiveToy(name)
                            ? 0
                            : 10;

                }

            }
        );


    /*
       Pokémon Dive Toys are always
       initialized at ZERO until
       Ms. Hill adds some.
    */

    if(
        inventory["Pokémon Dive Toys"]===
        undefined &&
        items["Pokémon Dive Toys"]
    ){

        inventory["Pokémon Dive Toys"]=
            0;

    }

}


/* =========================================
   LOAD INVENTORY
========================================= */

async function loadInventory(){

    try{

        const localInventory=
            JSON.parse(
                localStorage.getItem(
                    "dojoMarketInventory"
                )||"null"
            );


        if(
            localInventory&&
            typeof localInventory==="object"
        ){

            inventory=
                localInventory;

        }


        const onlineInventory=
            await firebaseGet(
                "inventory"
            );


        if(
            onlineInventory&&
            typeof onlineInventory==="object"
        ){

            inventory=
                onlineInventory;

            console.log(
                "📦 Inventory loaded from Firebase."
            );

        }


        ensureInventory();


        /*
           Save the complete inventory using the
           safe item_0/item_1/item_2 Firebase format.
        */

        const savedOnline=
            await firebasePut(
                "inventory",
                inventory
            );


        if(!savedOnline){

            console.warn(
                "⚠️ Inventory is working locally, but could not be saved online yet."
            );

        }


        saveLocal();


        updateShopAffordability();

        renderInventory();


        console.log(
            "✅ Inventory loaded successfully."
        );


    }catch(error){

        console.error(
            "❌ Inventory loading error:",
            error
        );

    }

}


/* =========================================
   INVENTORY QUANTITY
========================================= */

function qty(itemName){

    const fallback=
        isDiveToy(itemName)
            ? 0
            : 10;

    return Math.max(
        0,
        Number(
            inventory[itemName]??
            fallback
        )
    );

}


/* =========================================
   SAVE INVENTORY
========================================= */

async function saveInventory(){

    ensureInventory();

    saveLocal();

    return await firebasePut(
        "inventory",
        inventory
    );

}


/* =========================================
   REFRESH ONE STUDENT
========================================= */

async function refreshStudent(index){

    const onlineStudent=
        await firebaseGet(
            `students/${index}`
        );


    if(
        onlineStudent&&
        onlineStudent.points!==undefined
    ){

        students[index].points=
            Number(
                onlineStudent.points
            );

        saveLocal();

        return true;

    }

    return false;

}


/* =========================================
   SAVE STUDENT POINTS
========================================= */

async function savePoints(index){

    return await firebasePut(
        `students/${index}/points`,
        Number(
            students[index].points
        )||0
    );

}


/* =========================================
   REFRESH EVERYTHING
========================================= */

async function refreshAll(){

    const onlineStudents=
        await firebaseGet(
            "students"
        );


    if(onlineStudents){

        Object.keys(
            onlineStudents
        )
        .forEach(
            index=>{

                if(
                    students[index]&&
                    onlineStudents[index]?.points
                    !==undefined
                ){

                    students[index].points=
                        Number(
                            onlineStudents[index].points
                        );

                }

            }
        );

    }


    const onlineAccess=
        await firebaseGet(
            "storeAccess"
        );


    if(
        Array.isArray(
            onlineAccess
        )
    ){

        storeAccess=
            onlineAccess;

    }


    const onlineOrders=
        await firebaseGet(
            "orders"
        );


    if(onlineOrders){

        studentOrders=
            onlineOrders;

    }


    await loadInventory();

    saveLocal();

}


/* =========================================
   FIREBASE AUTH
========================================= */

async function startAuth(){

    console.log(
        "🧸 Student iPad mode: Firebase Authentication skipped."
    );

    return null;

}


/* =========================================
   OPEN DOJO MART
========================================= */

function openDojoMart(){

    if(!dojoDoors)return;

    dojoDoors.classList.add(
        "doors-open"
    );


    setTimeout(
        ()=>{

            if(welcomeScreen){

                welcomeScreen.style.opacity=
                    "0";

            }


            setTimeout(
                ()=>{

                    if(welcomeScreen){

                        welcomeScreen.style.display=
                            "none";

                    }


                    showScreen(
                        studentScreen
                    );


                    qa(".student-bubble")
                        .forEach(
                            (card,index)=>{

                                setTimeout(
                                    ()=>{

                                        card.classList.add(
                                            "show"
                                        );

                                    },
                                    index*100
                                );

                            }
                        );

                },
                500
            );

        },
        850
    );

}


/* =========================================
   STUDENT SELECTION
========================================= */

studentButtons.forEach(
    (button,index)=>{

        button.addEventListener(
            "click",
            ()=>{

                // Remember which student was clicked
                currentStudentIndex = index;


                // Always start with a fresh password
                selectedPasswordIcons = [];


                // Remove any old selections
                passwordIcons.forEach(
                    icon=>{
                        icon.classList.remove(
                            "selected"
                        );
                    }
                );


                // Reset the message
                passwordStatus.textContent =
                    "Choose 2 pictures";


                // Hide student selection
                hideScreen(
                    studentScreen
                );


                // SHOW PASSWORD SCREEN
                showScreen(
                    loginScreen
                );

            }
        );

    }
);
/* =========================================
   PASSWORD ICONS
========================================= */

passwordIcons.forEach(
    icon=>{

        icon.addEventListener(
            "click",
            ()=>{

                const name=
                    icon.dataset.icon;


                if(
                    selectedPasswordIcons.includes(
                        name
                    )
                ){

                    return;

                }


                if(
                    selectedPasswordIcons.length>=2
                ){

                    return;

                }


                selectedPasswordIcons.push(
                    name
                );


                icon.classList.add(
                    "selected"
                );


                if(
                    selectedPasswordIcons.length===
                    1
                ){

                    passwordStatus.textContent=
                        "Choose 1 more picture";

                    return;

                }


                passwordStatus.textContent=
                    "Checking password...";


                setTimeout(
                    checkStudentPassword,
                    400
                );

            }
        );

    }
);


/* =========================================
   CHECK PASSWORD
========================================= */

function checkStudentPassword(){

    if(
        currentStudentIndex===
        null
    ){

        return;

    }


    const student=
        students[
            currentStudentIndex
        ];


    const selected=
        [
            ...selectedPasswordIcons
        ].sort();


    const correct=
        [
            ...student.password
        ].sort();


    if(
        selected[0]===
        correct[0]&&
        selected[1]===
        correct[1]
    ){

        passwordStatus.textContent=
            "🔓 Password correct!";


        setTimeout(
            openStudentHome,
            500
        );

    }else{

        passwordStatus.textContent=
            "❌ Try again!";


        setTimeout(
            ()=>{

                selectedPasswordIcons=
                    [];


                passwordIcons.forEach(
                    icon=>
                        icon.classList.remove(
                            "selected"
                        )
                );


                passwordStatus.textContent=
                    "Choose 2 pictures";

            },
            800
        );

    }

}


/* =========================================
   STUDENT HOME
========================================= */

async function openStudentHome(){

    await refreshStudent(
        currentStudentIndex
    );


    hideScreen(
        loginScreen
    );


    showScreen(
        homeScreen
    );


    if(pointsNumber){

        pointsNumber.textContent=
            `⭐ ${students[currentStudentIndex].points}`;

    }


    selectedPasswordIcons=
        [];


    passwordIcons.forEach(
        icon=>
            icon.classList.remove(
                "selected"
            )

    );

}


/* =========================================
   OPEN SHOP
========================================= */

async function openShop(){

    await refreshStudent(
        currentStudentIndex
    );


    await loadInventory();


    hideScreen(
        homeScreen
    );


    showScreen(
        shopScreen
    );


    updateCartDisplay();

    updateShopAffordability();

}


/* =========================================
   CART TOTAL
========================================= */

function getCartTotal(){

    return cartItems.reduce(
        (total,item)=>
            total+item.price,
        0
    );

}


/* =========================================
   POINTS REMAINING
========================================= */

function getPointsRemaining(){

    if(
        currentStudentIndex===
        null
    ){

        return 0;

    }


    return Number(
        students[
            currentStudentIndex
        ].points||0
    )-
    getCartTotal();

}


/* =========================================
   SHOP AFFORDABILITY
========================================= */

function updateShopAffordability(){

    if(
        currentStudentIndex===
        null
    ){

        return;

    }


    const remaining=
        getPointsRemaining();


    qa(".reward-card")
        .forEach(
            card=>{

                const title=
                    card.querySelector(
                        "h3"
                    );

                const priceText=
                    card.querySelector(
                        "p"
                    );

                const button=
                    card.querySelector(
                        ".buy-btn"
                    );


                if(
                    !title||
                    !priceText||
                    !button
                ){

                    return;

                }


                const name=
                    title.textContent.trim();


                const match=
                    priceText.textContent.match(
                        /\d+/
                    );


                if(!match)return;


                const price=
                    Number(
                        match[0]
                    );


                const stock=
                    qty(name);


                const inCart=
                    cartItems.some(
                        item=>
                            item.name===
                            name
                    );


                if(stock<=0){

                    card.classList.add(
                        "out-of-stock"
                    );

                    card.classList.remove(
                        "cannot-afford"
                    );

                    button.disabled=
                        true;

                    button.textContent=
                        "Out of Stock";

                    return;

                }


                card.classList.remove(
                    "out-of-stock"
                );


                if(inCart){

                    card.classList.remove(
                        "cannot-afford"
                    );

                    button.disabled=
                        false;

                    button.textContent=
                        "🔴 Remove";

                    button.classList.add(
                        "remove-item-button"
                    );

                    return;

                }


                button.classList.remove(
                    "remove-item-button"
                );


                if(
                    remaining>=
                    price
                ){

                    card.classList.remove(
                        "cannot-afford"
                    );

                    button.disabled=
                        false;

                    button.textContent=
                        "🛍️ Choose";

                }else{

                    card.classList.add(
                        "cannot-afford"
                    );

                    button.disabled=
                        true;

                    button.textContent=
                        "Not Enough ⭐";

                }

            }
        );

}


/* =========================================
   SHOP BUTTONS
========================================= */

function setupShopButtons(){

    qa(".buy-btn")
        .forEach(
            button=>{

                button.addEventListener(
                    "click",
                    ()=>{

                        if(
                            currentStudentIndex===
                            null
                        ){

                            return;

                        }


                        const card=
                            button.closest(
                                ".reward-card"
                            );


                        if(!card)return;


                        const title=
                            card.querySelector(
                                "h3"
                            );


                        const priceText=
                            card.querySelector(
                                "p"
                            );


                        if(
                            !title||
                            !priceText
                        ){

                            return;

                        }


                        const name=
                            title.textContent.trim();


                        const price=
                            Number(
                                priceText
                                    .textContent
                                    .match(/\d+/)[0]
                            );


                        if(
                            qty(name)<=0
                        ){

                            return;

                        }


                        const existing=
                            cartItems.findIndex(
                                item=>
                                    item.name===
                                    name
                            );


                        if(
                            existing!==-1
                        ){

                            cartItems.splice(
                                existing,
                                1
                            );

                        }else{

                            if(
                                getPointsRemaining()<
                                price
                            ){

                                return;

                            }


                            cartItems.push({

                                name:name,

                                price:price

                            });

                        }


                        updateCartDisplay();

                        updateShopAffordability();

                    }
                );

            }
        );

}


/* =========================================
   CART DISPLAY
========================================= */

function updateCartDisplay(){

    if(!cartItemsContainer)return;


    if(
        cartItems.length===
        0
    ){

        cartItemsContainer.innerHTML=
            "<p>Your bag is empty! 🛍️</p>";

    }else{

        cartItemsContainer.innerHTML=
            cartItems.map(
                item=>`

                    <div class="cart-item">

                        <div class="cart-item-info">

                            <strong>
                                ${item.name}
                            </strong>

                            <span>
                                ⭐ ${item.price}
                            </span>

                        </div>

                    </div>

                `
            ).join("");

    }


    if(cartTotal){

        cartTotal.textContent=
            getCartTotal();

    }


    if(pointsRemaining){

        pointsRemaining.textContent=
            getPointsRemaining();

    }


    if(cartCount){

        cartCount.textContent=
            cartItems.length;

    }


    if(checkoutButton){

        checkoutButton.disabled=
            cartItems.length===
            0;

        checkoutButton.style.opacity=
            cartItems.length
                ? "1"
                : ".5";

    }

}


/* =========================================
   CREATE CHECKOUT BUTTON
========================================= */

function createCheckoutButton(){

    if(checkoutButton)return;

    /*
       IMPORTANT:
       Use the checkout button already in the HTML if one exists.
       This prevents the second duplicate CHECKOUT button from
       being created inside the cart.
    */

    checkoutButton=
        document.getElementById(
            "checkoutButton"
        )||
        document.querySelector(
            "#cartPanel .checkout-button"
        );


    if(!checkoutButton){

        if(!cartPanel)return;

        checkoutButton=
            document.createElement(
                "button"
            );

        checkoutButton.id=
            "checkoutButton";

        checkoutButton.className=
            "checkout-button";

        checkoutButton.textContent=
            "🛒 CHECKOUT";

        cartPanel.appendChild(
            checkoutButton
        );

    }


    checkoutButton.type=
        "button";


    checkoutButton.onclick=
        checkoutOrder;

}


/* =========================================
   CHECKOUT
========================================= */

async function checkoutOrder(){

    if(
        currentStudentIndex===
        null||
        !cartItems.length
    ){

        return;

    }


    await refreshStudent(
        currentStudentIndex
    );


    await loadInventory();


    const total=
        getCartTotal();


    const student=
        students[
            currentStudentIndex
        ];


    if(
        total>
        student.points
    ){

        alert(
            "You do not have enough Dojo Points for this order."
        );

        updateCartDisplay();

        updateShopAffordability();

        return;

    }


    for(
        const item of cartItems
    ){

        if(
            qty(item.name)<=0
        ){

            alert(
                `${item.name} is out of stock.`
            );

            await loadInventory();

            return;

        }

    }


    const oldInventory={
        ...inventory
    };


    const oldPoints=
        student.points;


    student.points-=
        total;


    cartItems.forEach(
        item=>{

            inventory[item.name]=
                Math.max(
                    0,
                    qty(item.name)-1
                );

        }
    );


    const pointsSaved=
        await savePoints(
            currentStudentIndex
        );


    if(!pointsSaved){

        student.points=
            oldPoints;

        inventory=
            oldInventory;

        alert(
            "⚠️ Your points could not be saved online. Please try again."
        );

        return;

    }


    const inventorySaved=
        await saveInventory();


    if(!inventorySaved){

        student.points=
            oldPoints;

        inventory=
            oldInventory;

        await savePoints(
            currentStudentIndex
        );

        await saveInventory();

        alert(
            "⚠️ Inventory could not be saved online. Please try again."
        );

        return;

    }


    const order={

        studentName:
            student.name,

        items:[
            ...cartItems
        ],

        total:
            total,

        remainingPoints:
            student.points,

        status:
            "processing"

    };


    studentOrders[
        currentStudentIndex
    ]=
        order;


    saveLocal();


    const orderSaved=
        await firebasePut(
            `orders/${currentStudentIndex}`,
            order
        );


    if(!orderSaved){

        alert(
            "⚠️ Your order could not be saved online. Please tell Ms. Hill."
        );

    }


    cartItems=[];


    hideScreen(
        shopScreen
    );


    if(cartPanel){

        cartPanel.classList.add(
            "hidden-cart"
        );

    }


    showReceipt();

}


/* =========================================
   RECEIPT SCREEN
========================================= */

function createReceiptScreen(){

    if(receiptScreen)return;


    receiptScreen=
        document.createElement(
            "section"
        );


    receiptScreen.id=
        "receiptScreen";


    receiptScreen.className=
        "hidden-screen";


    receiptScreen.style.cssText=
        `
        position:fixed;
        inset:0;
        z-index:9999;
        background:#fff8df;
        overflow-y:auto;
        padding:30px 20px 60px;
        box-sizing:border-box;
        flex-direction:column;
        align-items:center;
        `;


    document.body.appendChild(
        receiptScreen
    );

}


/* =========================================
   SHOW RECEIPT
========================================= */

function showReceipt(){

    const order=
        studentOrders[
            currentStudentIndex
        ];


    if(!order)return;


    const fulfilled=
        order.status===
        "fulfilled";


    receiptScreen.innerHTML=
        `

        <div style="
            width:100%;
            max-width:650px;
            text-align:center;
        ">

            <div style="
                font-size:55px;
            ">
                🧾
            </div>


            <h1 style="
                font-family:Fredoka,sans-serif;
                font-size:42px;
                color:#5936a3;
            ">
                Treasure Receipt
            </h1>


            <div style="
                background:${fulfilled?"#4caf50":"#f4c542"};
                color:${fulfilled?"white":"#4b3a00"};
                border-radius:20px;
                padding:18px;
                margin:20px 0;
                font-size:26px;
                font-weight:700;
            ">

                ${
                    fulfilled
                        ? "🟢 ORDER FULFILLED"
                        : "🟡 ORDER PROCESSING"
                }

            </div>


            <div style="
                background:white;
                border:4px dashed #d6b44c;
                border-radius:25px;
                padding:25px;
                text-align:left;
            ">

                <h2 style="
                    text-align:center;
                    color:#5936a3;
                ">
                    ${order.studentName}
                </h2>


                ${
                    order.items.map(
                        item=>`

                            <div style="
                                display:flex;
                                justify-content:space-between;
                                padding:15px;
                                margin:8px 0;
                                background:white;
                                border-radius:15px;
                                box-shadow:
                                    0 3px 8px
                                    rgba(0,0,0,.08);
                                font-size:20px;
                            ">

                                <strong>
                                    ${item.name}
                                </strong>

                                <strong>
                                    ⭐ ${item.price}
                                </strong>

                            </div>

                        `
                    ).join("")
                }


                <hr>


                <div style="
                    display:flex;
                    justify-content:space-between;
                    font-size:24px;
                ">

                    <strong>
                        Total:
                    </strong>

                    <strong>
                        ⭐ ${order.total}
                    </strong>

                </div>


                <div style="
                    display:flex;
                    justify-content:space-between;
                    font-size:22px;
                    margin-top:10px;
                ">

                    <strong>
                        Points Remaining:
                    </strong>

                    <strong>
                        ⭐ ${order.remainingPoints}
                    </strong>

                </div>

            </div>


            <div style="
                margin-top:25px;
                color:#5936a3;
                font-size:21px;
            ">

                ${
                    fulfilled
                        ? "🎉 Your treasures are ready! 🎉"
                        : "💜 Please wait for Ms. Hill to fulfill your order!"
                }

            </div>

        </div>

        `;


    showScreen(
        receiptScreen
    );

}


/* =========================================
   TEACHER TABLE
========================================= */

function renderTeacherTable(){

    if(
        !teacherStudentTableBody
    ){

        return;

    }


    teacherStudentTableBody.innerHTML=
        "";


    students.forEach(
        (student,index)=>{

            const order=
                studentOrders[index];


            const row=
                document.createElement(
                    "tr"
                );


            const isOpen=
                storeAccess.includes(
                    index
                );


            const completed=
                order?.status===
                "fulfilled";


            row.innerHTML=
                `

                <td>

                    <div class="
                        teacher-student-name
                    ">

                        <div class="
                            teacher-student-avatar
                        ">
                            👤
                        </div>

                        <span>
                            ${student.name}
                        </span>

                    </div>

                </td>

                `;


            const accessCell=
                document.createElement(
                    "td"
                );


            const accessButton=
                document.createElement(
                    "button"
                );


            accessButton.className=
                `teacher-store-toggle ${
                    isOpen
                        ? "open"
                        : "closed"
                }`;


            accessButton.textContent=
                isOpen
                    ? "🛍 Open Store"
                    : "🔒 Store Closed";


            accessButton.onclick=
                async()=>{

                    if(
                        storeAccess.includes(
                            index
                        )
                    ){

                        storeAccess=
                            storeAccess.filter(
                                value=>
                                    value!==index
                            );

                    }else{

                        storeAccess.push(
                            index
                        );

                    }


                    saveLocal();


                    await firebasePut(
                        "storeAccess",
                        storeAccess
                    );


                    renderTeacherTable();

                };


            accessCell.appendChild(
                accessButton
            );


            row.appendChild(
                accessCell
            );


            const orderCell=
                document.createElement(
                    "td"
                );


            if(
                order?.status===
                "processing"
            ){

                const orderButton=
                    document.createElement(
                        "button"
                    );


                orderButton.className=
                    "teacher-order-button";


                orderButton.textContent = `View Order (${Array.isArray(order.items) ? order.items.length : 0})`;

                orderButton.onclick=
                    ()=>{
                        openTeacherOrderDetails(
                            index
                        );
                    };


                orderCell.appendChild(
                    orderButton
                );

            }else{

                orderCell.innerHTML=
                    `

                    <span class="
                        teacher-no-order
                    ">

                        ${
                            order
                                ? "Completed"
                                : "No Order"
                        }

                    </span>

                    `;

            }


            row.appendChild(
                orderCell
            );


            const completedCell=
                document.createElement(
                    "td"
                );


            completedCell.innerHTML=
                `

                <span class="
                    teacher-status-circle
                    ${completed?"completed":""}
                "></span>

                `;


            row.appendChild(
                completedCell
            );


            const pointsCell=
                document.createElement(
                    "td"
                );


            const pointsInput=
                document.createElement(
                    "input"
                );


            pointsInput.type=
                "number";

            pointsInput.min=
                "0";

            pointsInput.step=
                "1";

            pointsInput.value=
                student.points;

            pointsInput.className=
                "teacher-points-input";


            const pointsWrapper=
                document.createElement(
                    "div"
                );


            pointsWrapper.style.display=
                "flex";

            pointsWrapper.style.alignItems=
                "center";

            pointsWrapper.style.justifyContent=
                "center";

            pointsWrapper.style.gap=
                "6px";


            pointsWrapper.append(
                "⭐",
                pointsInput
            );


            pointsCell.appendChild(
                pointsWrapper
            );


            row.appendChild(
                pointsCell
            );


            const updateCell=
                document.createElement(
                    "td"
                );


            const saveButton=
                document.createElement(
                    "button"
                );


            saveButton.className=
                "teacher-update-points";


            saveButton.textContent=
                "💾 Save";


            saveButton.onclick=
                async()=>{

                    const newPoints=
                        Math.floor(
                            Number(
                                pointsInput.value
                            )
                        );


                    if(
                        !Number.isFinite(
                            newPoints
                        )||
                        newPoints<0
                    ){

                        alert(
                            "Enter a valid whole number."
                        );

                        return;

                    }


                    const oldPoints=
                        student.points;


                    student.points=
                        newPoints;


                    saveButton.disabled=
                        true;


                    const saved=
                        await savePoints(
                            index
                        );


                    if(!saved){

                        student.points=
                            oldPoints;

                        saveButton.disabled=
                            false;

                        alert(
                            "⚠️ Points could not be saved online."
                        );

                        return;

                    }


                    saveLocal();


                    renderTeacherTable();

                };


            updateCell.appendChild(
                saveButton
            );


            row.appendChild(
                updateCell
            );


            teacherStudentTableBody.appendChild(
                row
            );

        }
    );

}


/* =========================================
   TEACHER ORDER DETAILS
========================================= */

function openTeacherOrderDetails(
    index
){

    const order=
        studentOrders[index];


    if(
        !order||
        !teacherOrderDetails
    ){

        return;

    }


    teacherOrderDetails.classList.remove(
        "hidden-order-details"
    );


    const completed=
        order.status===
        "fulfilled";


    orderDetailsContent.innerHTML=
        `

        <h3 class="
            order-student-title
        ">

            ${students[index].name}'s Order

        </h3>


        <div class="
            order-status-strip
            ${completed?"completed":""}
        ">

            ${
                completed
                    ? "🟢 Order Completed"
                    : "🟡 Order Processing"
            }

        </div>


        <div class="
            order-stat-box
        ">

            <div class="order-stat-row">

                <strong>
                    Total:
                </strong>

                <strong>
                    ⭐ ${order.total}
                </strong>

            </div>


            <div class="order-stat-row">

                <strong>
                    Points Remaining:
                </strong>

                <strong>
                    ⭐ ${order.remainingPoints}
                </strong>

            </div>


            <div class="order-stat-row">

                <strong>
                    Items:
                </strong>

                <strong>
                    ${order.items.length}
                </strong>

            </div>

        </div>


        <h4 class="
            order-items-title
        ">

            🛍️ Order Items

        </h4>


        ${
            order.items.map(
                (item,itemIndex)=>`

                    <div class="
                        order-item-detail
                    ">

                        <div>

                            <div class="
                                order-item-name
                            ">
                                ${item.name}
                            </div>

                            <div class="
                                order-item-price
                            ">
                                ⭐ ${item.price}
                            </div>

                        </div>


                        ${
                            completed
                                ? ""
                                : `

                                <button
                                    class="
                                        cancel-item-button
                                    "
                                    data-item="${itemIndex}">

                                    ❌ Cancel

                                </button>

                                `
                        }

                    </div>

                `
            ).join("")
        }


        ${
            completed
                ? ""
                : `

                <button
                    id="completeSelectedOrder"
                    class="
                        complete-order-button
                    ">

                    🟢 Complete Order

                </button>


                <button
                    id="cancelEntireOrder"
                    class="
                        cancel-entire-order-button
                    ">

                    ❌ Cancel Entire Order

                </button>

                `
        }

        `;


    teacherOrderDetails
        .querySelectorAll(
            ".cancel-item-button"
        )
        .forEach(
            button=>{

                button.onclick=
                    ()=>{

                        cancelSpecificOrderItem(
                            index,
                            Number(
                                button.dataset.item
                            )
                        );

                    };

            }
        );


    const completeButton=
        $("completeSelectedOrder");


    if(completeButton){

        completeButton.onclick=
            ()=>{
                completeOrder(index);
            };

    }


    const cancelButton=
        $("cancelEntireOrder");


    if(cancelButton){

        cancelButton.onclick=
            ()=>{
                cancelEntireOrder(index);
            };

    }

}


/* =========================================
   CANCEL ONE ITEM
========================================= */

async function cancelSpecificOrderItem(
    studentIndex,
    itemIndex
){

    const order=
        studentOrders[
            studentIndex
        ];


    const item=
        order?.items?.[itemIndex];


    if(
        !order||
        order.status!=="processing"||
        !item
    ){

        return;

    }


    students[
        studentIndex
    ].points+=
        item.price;


    inventory[item.name]=
        qty(item.name)+1;


    order.total-=
        item.price;


    order.remainingPoints+=
        item.price;


    order.items.splice(
        itemIndex,
        1
    );


    if(
        order.items.length===
        0
    ){

        delete studentOrders[
            studentIndex
        ];


        await firebaseDelete(
            `orders/${studentIndex}`
        );

    }else{

        await firebasePut(
            `orders/${studentIndex}`,
            order
        );

    }


    await savePoints(
        studentIndex
    );


    await saveInventory();


    saveLocal();


    renderTeacherTable();


    if(
        studentOrders[
            studentIndex
        ]
    ){

        openTeacherOrderDetails(
            studentIndex
        );

    }else{

        teacherOrderDetails.classList.add(
            "hidden-order-details"
        );

    }

}


/* =========================================
   CANCEL ENTIRE ORDER
========================================= */

async function cancelEntireOrder(
    studentIndex
){

    const order=
        studentOrders[
            studentIndex
        ];


    if(!order)return;


    const okay=
        confirm(
            `Cancel ${order.studentName}'s entire order and return ${order.total} points?`
        );


    if(!okay)return;


    students[
        studentIndex
    ].points+=
        order.total;


    order.items.forEach(
        item=>{

            inventory[item.name]=
                qty(item.name)+1;

        }
    );


    delete studentOrders[
        studentIndex
    ];


    await savePoints(
        studentIndex
    );


    await saveInventory();


    await firebaseDelete(
        `orders/${studentIndex}`
    );


    saveLocal();


    renderTeacherTable();


    if(teacherOrderDetails){

        teacherOrderDetails.classList.add(
            "hidden-order-details"
        );

    }

}


/* =========================================
   COMPLETE ORDER
========================================= */

async function completeOrder(
    studentIndex
){

    const order=
        studentOrders[
            studentIndex
        ];


    if(!order)return;


    order.status=
        "fulfilled";


    await firebasePut(
        `orders/${studentIndex}`,
        order
    );


    saveLocal();


    renderTeacherTable();


    openTeacherOrderDetails(
        studentIndex
    );

}


/* =========================================
   TEACHER INVENTORY
   SPREADSHEET STYLE
========================================= */

function renderInventory(){

    let table=
        $("teacherInventoryTable");

    if(!table){

        if(!teacherDashboard)return;

        const shell=
            document.createElement(
                "section"
            );

        shell.className=
            "teacher-inventory-manager";

        shell.innerHTML=
            `
            <div class="teacher-inventory-header">

                <div>

                    <h2>
                        📦 Treasure Inventory
                    </h2>

                    <p>
                        Update the quantity for each
                        treasure. All treasures start at
                        <strong>10</strong> except
                        <strong>Pokémon Dive Toys</strong>,
                        which starts at <strong>0</strong>.
                    </p>

                </div>

                <button
                    id="refreshInventory"
                    type="button"
                    class="refresh-inventory-button">

                    🔄 Refresh Inventory

                </button>

            </div>


            <div class="teacher-inventory-sheet-wrap">

                <table
                    id="teacherInventoryTable"
                    class="teacher-inventory-sheet">

                    <thead>

                        <tr>

                            <th>
                                Treasure
                            </th>

                            <th>
                                Price
                            </th>

                            <th>
                                Quantity
                            </th>

                            <th>
                                Status
                            </th>

                            <th>
                                Update
                            </th>

                        </tr>

                    </thead>


                    <tbody
                        id="teacherInventoryTableBody">
                    </tbody>

                </table>

            </div>
            `;


        teacherDashboard.appendChild(
            shell
        );


        table=
            $("teacherInventoryTable");


        const refreshButton=
            $("refreshInventory");


        if(refreshButton){

            refreshButton.onclick=
                async()=>{

                    refreshButton.disabled=
                        true;

                    await loadInventory();

                    refreshButton.disabled=
                        false;

                    alert(
                        "Inventory refreshed! 📦"
                    );

                };

        }

    }


    if(!table)return;


    ensureInventory();


    const body=
        $("teacherInventoryTableBody");


    if(!body)return;


    body.innerHTML="";


    const items=
        getStoreItems();


    Object.entries(items)
        .forEach(
            ([name,item])=>{

                const quantity=
                    qty(name);


                const row=
                    document.createElement(
                        "tr"
                    );


                if(quantity===0){

                    row.classList.add(
                        "inventory-empty-row"
                    );

                }


                const nameCell=
                    document.createElement(
                        "td"
                    );


                nameCell.innerHTML=
                    `
                    <strong>
                        ${name}
                    </strong>
                    `;


                const priceCell=
                    document.createElement(
                        "td"
                    );


                priceCell.textContent=
                    `⭐ ${item.price}`;


                const quantityCell=
                    document.createElement(
                        "td"
                    );


                const input=
                    document.createElement(
                        "input"
                    );


                input.type=
                    "number";


                input.min=
                    "0";


                input.step=
                    "1";


                input.value=
                    quantity;


                input.className=
                    "teacher-inventory-input";


                input.setAttribute(
                    "aria-label",
                    `Quantity for ${name}`
                );


                quantityCell.appendChild(
                    input
                );


                const statusCell=
                    document.createElement(
                        "td"
                    );


                statusCell.className=
                    quantity===0
                        ? "inventory-status-out"
                        : "inventory-status-in";


                statusCell.textContent=
                    quantity===0
                        ? "⚫ Out of Stock"
                        : `🟢 ${quantity} available`;


                const updateCell=
                    document.createElement(
                        "td"
                    );


                const saveButton=
                    document.createElement(
                        "button"
                    );


                saveButton.type=
                    "button";


                saveButton.className=
                    "teacher-inventory-save";


                saveButton.textContent=
                    "💾 Save";


                saveButton.onclick=
                    async()=>{

                        const newQuantity=
                            Math.floor(
                                Number(
                                    input.value
                                )
                            );


                        if(
                            !Number.isFinite(
                                newQuantity
                            )||
                            newQuantity<0
                        ){

                            alert(
                                "Enter a whole number 0 or greater."
                            );

                            input.focus();

                            return;

                        }


                        const oldQuantity=
                            qty(name);


                        inventory[name]=
                            newQuantity;


                        saveButton.disabled=
                            true;


                        saveButton.textContent=
                            "⏳ Saving...";


                        const saved=
                            await saveInventory();


                        saveButton.disabled=
                            false;


                        saveButton.textContent=
                            "💾 Save";


                        if(saved){

                            updateShopAffordability();

                            renderInventory();

                        }else{

                            inventory[name]=
                                oldQuantity;


                            alert(
                                "⚠️ Inventory could not be saved online. Please try again."
                            );


                            renderInventory();

                        }

                    };


                updateCell.appendChild(
                    saveButton
                );


                row.append(
                    nameCell,
                    priceCell,
                    quantityCell,
                    statusCell,
                    updateCell
                );


                body.appendChild(
                    row
                );

            }
        );

}


/* =========================================
   TEACHER DASHBOARD
========================================= */

async function openTeacherDashboard(){

    hideScreen(
        welcomeScreen
    );

    hideScreen(
        studentScreen
    );

    hideScreen(
        loginScreen
    );

    hideScreen(
        homeScreen
    );

    hideScreen(
        shopScreen
    );

    hideScreen(
        receiptScreen
    );


    await refreshAll();


    renderTeacherTable();

    renderInventory();


    showScreen(
        teacherDashboard
    );

}


/* =========================================
   EVENT LISTENERS
========================================= */

if(dojoDoorButton){

    dojoDoorButton.onclick=
        openDojoMart;

}


const rightDoor=
    q(".dojo-door-right");


if(rightDoor){

    rightDoor.onclick=
        openDojoMart;

}


if(shopButton){

    shopButton.onclick=
        openShop;

}


if(shopBack){

    shopBack.onclick=
        ()=>{

            hideScreen(
                shopScreen
            );

            showScreen(
                homeScreen
            );

        };

}


if(homeBack){

    homeBack.onclick=
        ()=>{

            if(
                currentStudentIndex!==null&&
                studentOrders[
                    currentStudentIndex
                ]
            ){

                return;

            }


            hideScreen(
                homeScreen
            );


            currentStudentIndex=
                null;


            cartItems=
                [];


            showScreen(
                studentScreen
            );

        };

}


if(loginBack){

    loginBack.onclick=
        ()=>{

            hideScreen(
                loginScreen
            );


            selectedPasswordIcons=
                [];


            passwordIcons.forEach(
                icon=>
                    icon.classList.remove(
                        "selected"
                    )
            );


            currentStudentIndex=
                null;


            showScreen(
                studentScreen
            );

        };

}


if(cartButton){

    cartButton.onclick=
        ()=>{

            updateCartDisplay();

            if(cartPanel){

                cartPanel.classList.remove(
                    "hidden-cart"
                );

            }

        };

}


if(closeCart){

    closeCart.onclick=
        ()=>{

            if(cartPanel){

                cartPanel.classList.add(
                    "hidden-cart"
                );

            }

            updateShopAffordability();

        };

}


if(closeOrderDetails){

    closeOrderDetails.onclick=
        ()=>{

            teacherOrderDetails.classList.add(
                "hidden-order-details"
            );

        };

}


if(reopenStoreButton){

    reopenStoreButton.onclick=
        async()=>{

            storeAccess=
                students.map(
                    (_,index)=>index
                );


            saveLocal();


            await firebasePut(
                "storeAccess",
                storeAccess
            );


            renderTeacherTable();


            alert(
                "🌈 Dojo Mart is open for the whole class!"
            );

        };

}


if(closeTeacherDashboardButton){

    closeTeacherDashboardButton.onclick=
        ()=>{

            hideScreen(
                teacherDashboard
            );


            currentStudentIndex=
                null;


            showScreen(
                welcomeScreen
            );

        };

}


/* =========================================
   KEYBOARD TEACHER SHORTCUT
========================================= */

document.addEventListener(
    "keydown",
    event=>{

        const key=
            event.key.toLowerCase();


        const teacherShortcut=
            (
                key==="m"&&
                event.shiftKey&&
                (
                    event.metaKey||
                    event.ctrlKey
                )
            )||
            (
                key==="t"&&
                event.altKey&&
                event.shiftKey&&
                (
                    event.metaKey||
                    event.ctrlKey
                )
            );


        if(teacherShortcut){

            event.preventDefault();

            openTeacherDashboard();

        }


        if(
            event.key===
            "Escape"
        ){

            if(
                teacherOrderDetails&&
                !teacherOrderDetails.classList.contains(
                    "hidden-order-details"
                )
            ){

                teacherOrderDetails.classList.add(
                    "hidden-order-details"
                );

                return;

            }


            if(
                teacherDashboard&&
                teacherDashboard.style.display!=="none"
            ){

                hideScreen(
                    teacherDashboard
                );

                showScreen(
                    welcomeScreen
                );

            }

        }

    }
);


/* =========================================
   STARTUP
========================================= */

hideScreen(
    studentScreen
);

hideScreen(
    loginScreen
);

hideScreen(
    homeScreen
);

hideScreen(
    shopScreen
);

hideScreen(
    teacherDashboard
);


if(cartPanel){

    cartPanel.classList.add(
        "hidden-cart"
    );

}


if(teacherOrderDetails){

    teacherOrderDetails.classList.add(
        "hidden-order-details"
    );

}


if(welcomeScreen){

    welcomeScreen.style.display=
        "flex";

    welcomeScreen.style.visibility=
        "visible";

    welcomeScreen.style.opacity=
        "1";

}


createCheckoutButton();

createReceiptScreen();

setupShopButtons();


/* =========================================
   LOAD FIREBASE DATA
========================================= */

(async()=>{

    loadingData=true;


    await startAuth();


    await refreshAll();


    loadingData=false;


    console.log(
        "🌈 Dojo Mart Firebase version loaded!"
    );


    console.log(
        "Online database:",
        FIREBASE_DB_URL
    );

})();
