import Web3 from "web3";
import * as actions from "./actions";
import CharityFunding from "../artifacts/contracts/CharityFunding.sol/CharityFunding.json";
import Project from "../artifacts/contracts/Project.sol/Project.json";
import {
  projectDataFormatter,
  withdrawRequestDataFormatter,
} from "../helper/helper";

const charityFundingContractAddress =
  "0x5FbDB2315678afecb367f032d93F642f64180aa3";

//Load web3
export const loadWeb3 = async (dispatch) => {
  const web3 = new Web3(Web3.givenProvider || "http://localhost:8545");
  dispatch(actions.web3Loaded(web3));
  return web3;
};

// Load connected wallet
export const loadAccount = async (web3, dispatch) => {
  const account = await web3.eth.getAccounts();
  const network = await web3.eth.net.getId();

  //   if (network !== Number(process.env.REACT_APP_NETWORK_ID)) {
  //     alert("Contract not deployed in this network !");
  //   }
  dispatch(actions.walletAddressLoaded(account[0]));
  localStorage.setItem("ADDRESS", account[0]);
  return account;
};

//Connect with crowd funding contract
export const loadCharityFundingContract = async (web3, dispatch) => {
  const charityFunding = new web3.eth.Contract(
    CharityFunding.abi,
    charityFundingContractAddress
  );
  dispatch(actions.charityFundingContractLoaded(charityFunding));
  return charityFunding;
};

// Start fund raising project
export const startFundRaising = async (
  web3,
  CharityFundingContract,
  data,
  onSuccess,
  onError,
  dispatch
) => {
  const {
    minimumContribution,
    deadline,
    targetContribution,
    projectTitle,
    projectDesc,
    account,
  } = data;

  await CharityFundingContract.methods
    .createProject(
      minimumContribution,
      deadline,
      targetContribution,
      projectTitle,
      projectDesc
    )
    .send({ from: account })
    .on("receipt", function (receipt) {
      const projectsReceipt = receipt.events.ProjectStarted.returnValues;
      const contractAddress = projectsReceipt.projectContractAddress;

      const formattedProjectData = projectDataFormatter(
        projectsReceipt,
        contractAddress
      );
      var projectConnector = new web3.eth.Contract(
        Project.abi,
        contractAddress
      );

      dispatch(actions.newProjectContractsLoaded(projectConnector));
      dispatch(actions.newProjectsLoaded(formattedProjectData));

      onSuccess();
    })
    .on("error", function (error) {
      onError(error.message);
    });
};

// 1 - Get all funding project address
// 2 - Connect with funding project contract
// 3 - Get project details
export const getAllFunding = async (CharityFundingContract, web3, dispatch) => {
  const fundingProjectList = await CharityFundingContract.methods
    .returnAllProjects()
    .call();

  const projectContracts = [];
  const projects = [];

  await Promise.all(
    fundingProjectList.map(async (contractAddress) => {
      var projectConnector = new web3.eth.Contract(
        Project.abi,
        contractAddress
      );
      const details = await projectConnector.methods.getProjectDetails().call();
      projectContracts.push(projectConnector);
      const formattedProjectData = projectDataFormatter(
        details,
        contractAddress
      );
      projects.push(formattedProjectData);
    })
  );

  dispatch(actions.projectContractsLoaded(projectContracts));
  dispatch(actions.projectsLoaded(projects));
};



// Contribute in fund raising project
export const contribute = async (
  charityFundingContract,
  data,
  dispatch,
  onSuccess,
  onError
) => {
  const { contractAddress, amount, account } = data;
  await charityFundingContract.methods
    .contribute(contractAddress)
    .send({ from: account, value: amount })
    .on("receipt", function (receipt) {
      dispatch(
        actions.amountContributor({
          projectId: contractAddress,
          amount: amount,
        })
      );
      onSuccess();
    })
    .on("error", function (error) {
      onError(error.message);
    });
};


// Request for withdraw amount
export const createWithdrawRequest = async (
  web3,
  contractAddress,
  data,
  onSuccess,
  onError
) => {
  const { description, amount, recipient, account } = data;
  var projectConnector = new web3.eth.Contract(Project.abi, contractAddress);
  await projectConnector.methods
    .createWithdrawRequest(description, amount, recipient)
    .send({ from: account })
    .on("receipt", function (receipt) {
      const withdrawReqReceipt =
        receipt.events.WithdrawRequestCreated.returnValues;
      const formattedReqData = withdrawRequestDataFormatter(
        withdrawReqReceipt,
        withdrawReqReceipt.requestId
      );
      onSuccess(formattedReqData);
    })
    .on("error", function (error) {
      onError(error.message);
    });
};