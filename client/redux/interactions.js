import Web3 from "web3";
import * as actions from "./actions";
import CharityFunding from "../artifacts/contracts/CharityFunding.sol/CharityFunding.json";
import Project from "../artifacts/contracts/Project.sol/Project.json";
import {
  projectDataFormatter,
  withdrawRequestDataFormatter,
  weiToEther,
} from "../helper/helper";

// const charityFundingContractAddress =
//   "0xdEAC32b4c0C0034C83090B44b8CFA95C564d34F6";
// const charityFundingContractAddress =
//   "0x5FbDB2315678afecb367f032d93F642f64180aa3";
// const charityFundingContractAddress =
// "0x414f37A63f3A3EC693A680Ca6F7F0A64c7A7B9BF";

const charityFundingContractAddress =
"0x9a48634AA12B9632E17c557821856eAb07BEDA44";
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
  const { description, amount, recipient, account, proofFile } = data;
  var projectConnector = new web3.eth.Contract(Project.abi, contractAddress);
  const resultAuthUpload = await authUpload(proofFile);
  if (resultAuthUpload) {
    /**
     * upload file
     */
    const resultUploadFile = await uploadToCloud(
      resultAuthUpload.url_upload_file,
      proofFile.type,
      await proofFile.arrayBuffer()
    );

    // /**
    //  * upload torrent
    //  */
    // await uploadToCloud(
    //   resultAuthUpload.url_upload_torrent,
    //   proofFile.type,
    //   await proofFile.arrayBuffer()
    // );

    if (resultUploadFile) {
      await projectConnector.methods
        .createWithdrawRequest(
          description,
          amount,
          recipient,
          resultAuthUpload.webseed[0]
        )
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
    }
  }
};

const uploadToCloud = async (url, fileType, data) => {
  var xhr = new XMLHttpRequest();
  // xhr.withCredentials = true;

  xhr.addEventListener("readystatechange", function () {
    if (this.readyState === 4) {
      console.log(this.responseText);
    }
  });

  xhr.open("PUT", url);
  // xhr.setRequestHeader("authority", "storage.googleapis.com");
  xhr.setRequestHeader("accept", "application/json, text/plain, */*");
  xhr.setRequestHeader(
    "accept-language",
    "vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7,fr;q=0.6,fr-FR;q=0.5"
  );
  // xhr.setRequestHeader("content-type", fileType);
  // xhr.setRequestHeader("content-type", "image/jpeg");
  // xhr.setRequestHeader("Access-Control-Allow-Origin", "http://localhost:3000/");
  // xhr.setRequestHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  // xhr.setRequestHeader('Access-Control-Allow-Credentials', 'true')

  // xhr.setRequestHeader("referer", "https://eueno.io/");
  // xhr.setRequestHeader(
  //   "sec-ch-ua",
  //   '"Chromium";v="110", "Not A(Brand";v="24", "Google Chrome";v="110"'
  // );
  // xhr.setRequestHeader("sec-ch-ua-mobile", "?0");
  // xhr.setRequestHeader("sec-ch-ua-platform", '"Windows"');
  // xhr.setRequestHeader("sec-fetch-dest", "empty");
  // xhr.setRequestHeader("sec-fetch-mode", "cors");
  // xhr.setRequestHeader("sec-fetch-site", "cross-site");
  // xhr.setRequestHeader(
  //   "user-agent",
  //   "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36"
  // );
  // xhr.setRequestHeader(
  //   "x-client-data",
  //   "CJG2yQEIorbJAQjBtskBCKmdygEIwfXKAQiTocsBCJv+zAE="
  // );

  xhr.send(data);
  let result = true;
  // xhr.addEventListener("load", (evt) => {
  //   result = true;
  // });
  return result;
};

const authUpload = async (file) => {
  var axios = require("axios");
  var data = JSON.stringify({
    project_id: "63f6d6f22c8c852ae487212f",
    path: "/",
    content_length: file.size,
    content_type: file.type,
    file_name: file.name,
    method: "UN_ENCRYPT",
    action: "write",
  });

  var config = {
    method: "post",
    url: "https://developers.eueno.io/api/v3/project-file/auth-upload",
    headers: {
      authority: "developers.eueno.io",
      accept: "application/json, text/plain, */*",
      "accept-language":
        "vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7,fr;q=0.6,fr-FR;q=0.5",
      authorization:
        "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIweDQ1YzliZDM3ZjE1ZTNmZWQ0NjAxZDBlODEwNTEwZWQ1MThhYjQ4NTciLCJtZW1vIjoiMzUxNzE3ODE3MzE5NDI0MCIsImV4cCI6MTY3NzIxMjc2MSwiaWF0IjoxNjc3MTI2MzYxfQ.clcopk2zY0noJrbT6arqJx7eipAs2FiB0snWsvbhzRY",
      "content-type": "application/json",

      // origin: "https://eueno.io",
      // referer: "https://eueno.io/",
      // "sec-ch-ua":
      //   '"Chromium";v="110", "Not A(Brand";v="24", "Google Chrome";v="110"',
      // "sec-ch-ua-mobile": "?0",
      // "sec-ch-ua-platform": '"Windows"',
      // "sec-fetch-dest": "empty",
      // "sec-fetch-mode": "cors",
      // "sec-fetch-site": "same-site",
      // "user-agent":
      //   "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36",
    },
    data: data,
  };
  let result = false;
  await axios(config)
    .then(function (response) {
      result = response.data;
      if ((result.status = 200)) {
        result = result.data;
      }
    })
    .catch(function (error) {
      result = false;
    });
  return result;
};

// Get all withdraw request
export const getAllWithdrawRequest = async (
  web3,
  contractAddress,
  onLoadRequest
) => {
  var projectConnector = new web3.eth.Contract(Project.abi, contractAddress);
  var withdrawRequestCount = await projectConnector.methods
    .numOfWithdrawRequests()
    .call();
  var withdrawRequests = [];

  if (withdrawRequestCount <= 0) {
    onLoadRequest(withdrawRequests);
    return;
  }

  for (var i = 1; i <= withdrawRequestCount; i++) {
    const req = await projectConnector.methods.withdrawRequests(i - 1).call();
    withdrawRequests.push(
      withdrawRequestDataFormatter({ ...req, requestId: i - 1 })
    );
  }
  onLoadRequest(withdrawRequests);
};

// Vote for withdraw request
export const voteWithdrawRequest = async (web3, data, onSuccess, onError) => {
  const { contractAddress, reqId, account } = data;
  var projectConnector = new web3.eth.Contract(Project.abi, contractAddress);
  await projectConnector.methods
    .voteWithdrawRequest(reqId)
    .send({ from: account })
    .on("receipt", function (receipt) {
      console.log(receipt);
      onSuccess();
    })
    .on("error", function (error) {
      onError(error.message);
    });
};

// Withdraw requested amount
export const withdrawAmount = async (
  web3,
  dispatch,
  data,
  onSuccess,
  onError
) => {
  const { contractAddress, reqId, account, amount } = data;
  var projectConnector = new web3.eth.Contract(Project.abi, contractAddress);
  await projectConnector.methods
    .withdrawRequestedAmount(reqId)
    .send({ from: account })
    .on("receipt", function (receipt) {
      console.log(receipt);
      dispatch(
        actions.withdrawContractBalance({
          contractAddress: contractAddress,
          withdrawAmount: amount,
        })
      );
      onSuccess();
    })
    .on("error", function (error) {
      onError(error.message);
    });
};

export const getContributors = async (
  web3,
  contractAddress,
  onSuccess,
  onError
) => {
  try {
    var projectConnector = new web3.eth.Contract(Project.abi, contractAddress);
    const listContributorAddress = await projectConnector.methods
      .getAllContributorAddress()
      .call();

    let listContributionDetail = [];
    await Promise.all(
      listContributorAddress.map(async (contributorAddress) => {
        const amountOfContribution = await projectConnector.methods
          .contributiors(contributorAddress)
          .call();
        listContributionDetail.push({
          contributor: contributorAddress,
          amount: Number(weiToEther(amountOfContribution)),
        });
      })
    );

    onSuccess(listContributionDetail);
  } catch (error) {
    onError(error);
  }
};

//Get my contributions
export const getMyContributionList = async (
  charityFundingContract,
  account
) => {
  let projectsContributed = [];
  for (let i = 0; i < 10 ** 10; i++) {
    try {
      const projectAddress = await charityFundingContract.methods
        .projectsContributedOfAccount(account, i)
        .call();
      projectsContributed.push(projectAddress);
    } catch (error) {
      break;
    }
  }

  let listContributionDetail = [];
  await Promise.all(
    projectsContributed.map(async (projectAddress) => {
      const amountOfContribution = await charityFundingContract.methods
        .contributorProjectAmount(account, projectAddress)
        .call();
      listContributionDetail.push({
        projectAddress: projectAddress,
        amount: Number(weiToEther(amountOfContribution)),
        contributor: account,
      });
    })
  );
  return listContributionDetail;
  //   const getContributions = await charityFundingContract.getPastEvents(
  //   "ContributionReceived",
  //   {
  //     filter: { contributor: account },
  //     fromBlock: 0,
  //     toBlock: "latest",
  //   }
  // );
  // return groupContributionByProject(getContributions);
};
export const requestRefund = async (
  web3,
  contractAddress,
  data,
  onSuccess,
  onError
) => {
  const { account } = data;
  var projectConnector = new web3.eth.Contract(Project.abi, contractAddress);
  await projectConnector.methods
    .requestRefund()
    .send({ from: account })
    .on("receipt", function (receipt) {
      onSuccess(
        weiToEther(receipt.events.RefundRequestSuccessful.returnValues.amount)
      );
    })
    .on("error", function (error) {
      onError(error.message);
    });
};

export const getRefundSuccessfulList = async (
  web3,
  contractAddress,
  onSuccess,
  onError
) => {
  try {
    var projectConnector = new web3.eth.Contract(Project.abi, contractAddress);
    const getRefundList = await projectConnector.getPastEvents(
      "RefundRequestSuccessful",
      {
        fromBlock: 0,
        toBlock: "latest",
      }
    );
    onSuccess(getRefundList);
  } catch (error) {
    onError(error);
  }
};
