const searchInput = document.querySelector("input[name='look']");
let timeOut;
searchInput.addEventListener("input",function debouncer(){
    clearTimeout(timeOut);
    
    if(searchInput.value.length===0){
        updateResults(null,0);
        return
    }    
    
    timeOut = setTimeout(()=>{
        fetchSearch(searchInput.value);
    },300)
})


function fetchSearch(value){

    fetch("/search",{
        method:"POST",
        headers:{
            "Content-Type":"application/json",
        },
        body:JSON.stringify({
            search:value,
        })
    })
    .then(response=>{
        if(response.ok || response.status===400){
            return response.json();
        }
    })
    .then(data=>{
        if(data.success){
            updateResults(data.products,data.products.length);
        }else{
            console.log(data.message);
        }
    })
    .catch(error=>{
        console.log(error.message);
    })
}


function updateResults(products,length){
    let listWrapper = document.getElementById("searchResults");
    let searchResults = "";

    if(!length){
        listWrapper.innerHTML = searchResults;
    }else{
        for(const product of products){
            searchResults +=   `<a class="text-decoration-none text-dark" href="/shop/product?id=${product._id}">
                                    <li class="text-black viga p-3 results" style="display: flex; justify-content: space-between; align-items: center;">
                                    <span>${product.brand} ${product.model}</span>
                                    <i class="bi bi-box-arrow-up-right"></i>
                                    </li>
                                </a>`;
}
        listWrapper.innerHTML = searchResults;
    }

}

function focusInput(){
    searchInput.focus();
}

function clearInput(){
    searchInput.value="";
}