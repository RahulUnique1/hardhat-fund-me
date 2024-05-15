const { deployments, ethers, getNamedAccounts, network } = require("hardhat")

async function main() {
    const deployer = await ethers.provider.getSigner()
    const fundMe = await ethers.getContractAt(
        "FundMe",
        (await deployments.get("FundMe")).address,
        deployer,
    )
    const transactionResponse = await fundMe.withdraw()
    await transactionResponse.wait(1)
    console.log("Got it back!")
    const fundMeBalance = await ethers.provider.getBalance(
        await fundMe.getAddress(),
    )
    console.log("fundMeBalance", fundMeBalance)
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
