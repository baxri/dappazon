const { expect } = require("chai");
const { ethers } = require("hardhat");

const tokens = (n) => {
  return ethers.utils.parseUnits(n.toString(), "ether");
};

const ID = 1;
const NAME = "Shoes";
const CATEGORY = "Clothing";
const IMAGE =
  "https://static.nike.com/a/images/c_limit,w_592,f_auto/t_product_v1/cd76efc6-0d14-45f3-811b-703a4b2c4d2b/air-jordan-6-retro-mens-shoes-CVPFVM.png";
const COST = tokens(1);
const RATING = 4;
const STOCK = 5;

describe("Dappazon", () => {
  let dappazon;
  let deployer, buyer;

  beforeEach(async () => {
    [deployer, buyer] = await ethers.getSigners();
    dappazon = await (await ethers.getContractFactory("Dappazon")).deploy();
  });

  describe("Deployment", () => {
    it("Has a name", async () => {
      expect(await dappazon.name()).to.equals("Dappazon");
    });

    it("Set the owner", async () => {
      expect(await dappazon.owner()).to.equals(deployer.address);
    });
  });

  describe("Buy and Withdraw", () => {
    let transaction;

    beforeEach(async () => {
      transaction = await dappazon
        .connect(deployer)
        .list(ID, NAME, CATEGORY, IMAGE, COST, RATING, STOCK);

      transaction = await dappazon.connect(buyer).buy(ID, { value: COST });
    });

    it("Updates contract balance", async () => {
      const result = await ethers.provider.getBalance(dappazon.address);
      expect(result).to.equal(COST);
    });

    it("Updates buyers order count", async () => {
      const result = await dappazon.orderCount(buyer.address);
      expect(result).to.equal(1); 
    });

    it("Saves order on chain", async () => {
      const order = await dappazon.orders(buyer.address, 1);
      expect(order.time).to.greaterThan(0);
      expect(order.item.name).to.equals(NAME);
    });

    it("Emits buy event", () => {
      expect(transaction).to.emit(dappazon, "Buy");
    });

    it("Withdraws funds", async () => {
      await dappazon.connect(deployer).withdraw();
      const result = await ethers.provider.getBalance(dappazon.address);
      expect(result).to.equal(0);
    });
  });
});
