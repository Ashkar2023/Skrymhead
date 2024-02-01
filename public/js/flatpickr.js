const element = document.querySelector("#reportRange")
let datesToSent;


const fp = flatpickr(element, {
    mode: "range",
    maxDate: "today",
    dateFormat: "j-M-Y",
    onClose: function (sD, dateS, instance) {
        datesToSent = sD;
    }
});


const yearSelect = document.getElementById("selectYear");
yearSelect.addEventListener("click", () => { element.value = fp.currentYear })


const downloadReport = async () => {
    try {
        const response = await fetch("/admin/salesreport", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                date: datesToSent
            })
        })

        if (!response.ok) {
            throw new Error("couldn't reach server!")
        }
        const data = await response.json();

        if (data.success) {

            let tableHtml = "";
            data.sales.forEach(order => {
                tableHtml += '<tr>' +
                    `<td>${order.order_date}</td>` +
                    `<td>${order.status}</td>` +
                    `<td>${order.totalPrice}</td>` +
                    `<td>${order.payment_type}</td>` +
                    `<td>${order.customer.email}</td>` +
                    `<td>${order.customer.name}</td>` +
                    `<td>${order.order_id}</td>` +
                    '</tr>';
            });

            const headerDates = datesToSent.map(date=>{
                return date.toLocaleDateString();
            })

            let tableBody = document.getElementById("tableBody");
            tableBody.innerHTML = tableHtml;
            let header = document.getElementById("header").innerText= `SALES REPORT ${headerDates[0]+" to "+headerDates[1]} `;
            generatePdf()
        }


    } catch (error) {
        console.log(error.message)
    }
}

function generatePdf(){
    console.log("heelpp")

    const htmlContent = document.getElementById("salesReport").cloneNode(true);
    console.log(htmlContent)
    let opt = {
        margin: 0,
        filename: 'Skrymhead-Sales-report',
        html2canvas: { scale: 5 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    };
    
    html2pdf().set(opt).from(htmlContent).save();
    console.log("heelpp")

}

