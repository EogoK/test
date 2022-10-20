const foodItems = document.querySelector(".food-items");
const categoryItems = document.querySelector(".category-items")
const foodItemTemplate = document.querySelector('#food-item');
const categoryItemTemplate = document.querySelector('#category-item');
const cart = document.querySelector('.cart');
const cartItemTemplate = document.querySelector('#cart-item');
const cartItems = document.querySelector('.cart__items');
const cartTotalPrice = document.querySelector('.cart__total-price');
const cartFurtherButton = document.querySelector('.cart__further');

Telegram.WebApp.ready()
configureThemeColor(Telegram.WebApp.colorScheme);
configureMainButton({text: 'в корзину', color: '#008000', onclick: mainButtonClickListener}); //view cart
Telegram.WebApp.MainButton.show();

function mainButtonClickListener() {
    if (Telegram.WebApp.MainButton.text.toLowerCase() === 'в корзину') {
        configureMainButton({text: 'к товарам', color: '#FF0000', onclick: mainButtonClickListener}); //close cart
    } else {
        configureMainButton({text: 'в корзину', color: '#008000', onclick: mainButtonClickListener}); //view cart
    }
    cart.classList.toggle('active');
}

function configureMainButton({text, color, textColor = '#ffffff', onclick}) {
    Telegram.WebApp.MainButton.text = text.toUpperCase();
    Telegram.WebApp.MainButton.color = color;
    Telegram.WebApp.MainButton.textColor = textColor;
    Telegram.WebApp.MainButton.onClick(onclick);
}

function configureThemeColor(color) {
    if (color === 'dark') {
        document.documentElement.style.setProperty('--body-background-color', '#1f1e1f');
        document.documentElement.style.setProperty('--title-color', 'white');
        document.documentElement.style.setProperty('--sub-text-color', 'white');
    }
}

cartFurtherButton.addEventListener('click', () => {
    if (cartItems.innerHTML === '') {
        cartTotalPrice.classList.remove('fluctuate');
        void cartFurtherButton.offsetWidth;
        cartTotalPrice.classList.add('fluctuate');
    } else {
        const items = [...cartItems.children].reduce((res, cartItem) => {
        const cartItemName = cartItem.querySelector('.cart-item__name');
        const cartItemPrice = cartItem.querySelector('.cart-item__price');
        const cartItemAmount = cartItem.querySelector('.cart-item__amount');
        res.push({
            name: cartItemName.textContent,
            price: cartItemPrice.textContent,
            amount: parseInt(cartItemAmount.textContent)
        });
        return res;
        }, []);
        fetch('/submitOrder', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                initData: window.Telegram.WebApp.initData,
                items: items,
                totalPrice: cartTotalPrice.textContent
            })
        });
    }
})

async function loadSubCategories(category) {
    const response = await fetch('/static/products.json');
    const items = await response.json();

    const response1 = await fetch('/static/catpics.json');
    const catpics = await response1.json()

    const subcategs = Object.keys(items[category])
    subcategs.forEach((subcateg, index) => {
        let subcategItem = categoryItemTemplate.content.cloneNode(true);
        const subcategItemImg = subcategItem.querySelector('.category-item__icon');
        const subcategItemName = subcategItem.querySelector('.category-item__name');
        
        subcategItemImg.src = catpics[category];
        subcategItemName.textContent = subcateg;
        subcategItem.querySelector('.category-item').dataset.id = index;
        categoryItems.appendChild(subcategItem);

        subcategItem = categoryItems.querySelector(`.category-item[data-id="${index}"]`);
        const goCategoryButton = subcategItem.querySelector(".category-item__button[data-add]");
        goCategoryButton.addEventListener('click', () => goCategoryListener(category, subcateg));
    })
    // for(var i = 0, size = subcategs.length; i < size; i++){
    //     var subcateg = subcategs[i];
    //     let subcategItem = categoryItemTemplate.content.cloneNode(true);
    //     const subcategItemImg = subcategItem.querySelector('.category-item__icon');
    //     const subcategItemName = subcategItem.querySelector('.category-item__name');
        
    //     subcategItemImg.src = catpics[category];
    //     subcategItemName.textContent = subcateg;
    //     subcategItem.querySelector('.category-item').dataset.id = i;
    //     categoryItems.appendChild(subcategItem);

    //     subcategItem = categoryItems.querySelector(`.category-item[data-id="${i}"]`);
    //     const goCategoryButton = subcategItem.querySelector(".category-item__button[data-add]");
    //     goCategoryButton.addEventListener('click', () => goCategoryListener(category, subcateg));
    // }
}
loadSubCategories(category)

function goCategoryListener(category, subcategory) {
    window.location.href = "./products?category=" + category + "&subcategory=" + subcategory
}

function addItemListener(foodItem, foodItemId) {
    showRemoveItemButton(foodItem);

    const cartItem = getCartItem(foodItem, foodItemId);
    cartItemAddListener(foodItem, cartItem);
}

function cartItemAddListener(foodItem, cartItem) {
    incrementFoodItemCount(foodItem);
    updateItemsPrices(foodItem, cartItem);
    updateTotalPrice();
}

function removeItemListener(foodItem, foodItemId) {
    const cartItem = getCartItem(foodItem, foodItemId);
    cartItemRemoveListener(foodItem, cartItem);
}

function cartItemRemoveListener(foodItem, cartItem) {
    const foodItemCount = parseInt(foodItem.dataset.count);

    if (foodItemCount === 1) {
        hideRemoveItemButton(foodItem, cartItem);
    } else {
        decrementFoodItemCount(foodItem, cartItem);
        updateItemsPrices(foodItem, cartItem);
    }
    updateTotalPrice();
}

function getCartItem(foodItem, foodItemId) {
    const existingCartItem = document.querySelector(`.cart-item[data-food-item-id="${foodItemId}"]`);
    if (existingCartItem) {
        return existingCartItem;
    } else {
        let cartItem = createCartItem(foodItem, foodItemId);
        cartItems.prepend(cartItem);
        sortCart();

        cartItem = cartItems.querySelector(`.cart-item[data-food-item-id="${foodItemId}"]`);
        const cartItemAddButton = cartItem.querySelector('.cart-item__button[data-add]');
        cartItemAddButton.addEventListener('click', () => cartItemAddListener(foodItem, cartItem));

        const cartItemRemoveButton = cartItem.querySelector('.cart-item__button[data-remove]');
        cartItemRemoveButton.addEventListener('click', () => cartItemRemoveListener(foodItem, cartItem));
        return cartItem;
    }
}

function sortCart() {
    const items = [...cartItems.children];
    items.sort((a, b) => parseInt(a.dataset.foodItemId) - parseInt(b.dataset.foodItemId));
    cartItems.innerHTML = '';
    items.forEach(cartItem => cartItems.appendChild(cartItem));
}

function createCartItem(foodItem, foodItemId) {
    const cartItem = cartItemTemplate.content.cloneNode(true);
    const foodItemName = foodItem.querySelector('.food-item__name');
    const cartItemName = cartItem.querySelector('.cart-item__name');
    cartItemName.textContent = foodItemName.textContent

    const cartItemAmount = cartItem.querySelector('.cart-item__amount');
    cartItemAmount.textContent = foodItem.dataset.count + 'x';

    const foodItemIcon = foodItem.querySelector('.food-item__icon');
    const cartItemIcon = cartItem.querySelector('.cart-item__icon');
    cartItemIcon.src = foodItemIcon.src;

    const foodItemPrice = foodItem.querySelector('.food-item__price');
    const cartItemPrice = cartItem.querySelector('.cart-item__price');
    cartItemPrice.textContent = formatter.format(parseFoodItemPrice(foodItemPrice.textContent) * parseInt(foodItem.dataset.count));

    cartItem.querySelector('.cart-item').dataset.foodItemId = foodItemId.toString();
    return cartItem;
}

function updateItemsPrices(foodItem, cartItem) {
    const foodItemPriceElement = foodItem.querySelector('.food-item__price');
    const foodItemPrice = parseFoodItemPrice(foodItemPriceElement.textContent);
    const foodItemCount = parseInt(foodItem.dataset.count);
    const cartItemAmount = cartItem.querySelector('.cart-item__amount');
    const cartItemPriceElement = cartItem.querySelector('.cart-item__price');
    cartItemPriceElement.textContent = formatter.format(foodItemPrice * foodItemCount);
    cartItemAmount.textContent = foodItem.dataset.count + 'x';
}

function updateTotalPrice() {
    let total = 0;
    for (const item of cartItems.children) {
        total += parseFoodItemPrice(item.querySelector('.cart-item__price').textContent);
    }
    cartTotalPrice.textContent = 'Total: ' + formatter.format(total);
}

function showRemoveItemButton(foodItem) {
    const addItemButton = foodItem.querySelector(".food-item__button[data-add]");
    const removeItemButton = foodItem.querySelector(".food-item__button[data-remove]");

    addItemButton.style.left = '60%';
    addItemButton.textContent = '+';
    removeItemButton.style.width = '40%';
}

function hideRemoveItemButton(foodItem, cartItem) {
    const addItemButton = foodItem.querySelector(".food-item__button[data-add]");
    const foodItemCountElement = foodItem.querySelector('.food-item__count');

    addItemButton.style.left = '0';
    addItemButton.textContent = 'добавить'; //add
    foodItem.removeAttribute('data-count');
    foodItemCountElement.style.opacity = 0;
    cartItem.remove();
}

function incrementFoodItemCount(foodItem) {
    const foodItemCountElement = foodItem.querySelector('.food-item__count');

    if (!foodItem.dataset.count) {
        foodItem.dataset.count = '1'
        foodItemCountElement.style.opacity = 1;
    } else {
        const foodItemCount = parseInt(foodItem.dataset.count);
        foodItem.dataset.count = (foodItemCount + 1).toString();
    }

    foodItemCountElement.textContent = foodItem.dataset.count;
}

function decrementFoodItemCount(foodItem) {
    const foodItemCountElement = foodItem.querySelector('.food-item__count');
    const foodItemCount = parseInt(foodItem.dataset.count);
    foodItem.dataset.count = (foodItemCount - 1).toString();

    foodItemCountElement.textContent = foodItem.dataset.count;
}

const formatter = new Intl.NumberFormat('ru-RU', {style: 'currency', currency: 'RUB'});

function parseFoodItemPrice(price) {
    return parseFloat(price.replaceAll(/\$/g, ''));
}