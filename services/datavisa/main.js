const apiModule = require('./apiDataVisa');

async function main() {
    try {
        const token = await apiModule.getToken();
        // Suponiendo que el número de documento del cliente es '20303312'
        const debtData = await apiModule.queryDebt(token, '27075033');
        console.log(debtData);
    } catch (error) {
        console.error(error);
    }
}

main();
