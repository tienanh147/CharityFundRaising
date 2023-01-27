
import moment from "moment";
import web3 from "web3";
import _ from 'lodash';

export const weiToEther = (num) =>{
    return web3.utils.fromWei(num, 'ether')
}

export const etherToWei = (num) => {
  const weiBigNumber = web3.utils.toWei(num, 'ether');
  const wei = weiBigNumber.toString();
  return wei
}

export const unixToDate = (unixDate) =>{
  return moment(unixDate * 1000).format("DD/MM/YYYY");
}

export const state = ["Fundraising", "Expired", "Successful"];

export const projectState = (data) =>{
  if (Number(data.goalAmount) <= Number(data.currentAmount)) return state[2];
  else if ( data.projectDeadline < moment().unix() ) return state[1];
  else return state[0];
  // return data.goalAmount <= data.currentAmount ? state[2] : data.projectDeadline < moment().unix() ? state[1]: state[0];
}

export const projectDataFormatter = (data,contractAddress) =>{
  const formattedData = {
    address:contractAddress,
    creator:data?.projectStarter,
    contractBalance: data.balance?weiToEther(data.balance):0,
    title:data.title,
    description:data.desc,
    minContribution:weiToEther(data.minContribution),
    goalAmount:weiToEther(data.goalAmount),
    currentAmount:weiToEther(data.currentAmount),
    state: projectState(data),
    deadline:unixToDate(Number(data.projectDeadline)),
    progress:Math.round((Number(weiToEther(data.currentAmount))/Number(weiToEther(data.goalAmount)))*100)
  }
  return formattedData;
}

export const connectWithWallet = async (onSuccess) => {
  //connect web3 with http provider
  if (window.ethereum) {
   window.ethereum.request({method:"eth_requestAccounts"})
   .then(res=>{
    onSuccess()
   }).catch(error=>{
     alert(error.message)
   })
  } else {
    window.alert(
      "Non-Ethereum browser detected. You should consider trying MetaMask!"
    );
  }
};

export const chainOrAccountChangedHandler = () => {
  // reload the page to avoid any errors with chain or account change.
  window.location.reload();
}

export const withdrawRequestDataFormatter = (data) =>{
  return{
     requestId:data.requestId,
     totalVote:data.noOfVotes,
     amount:weiToEther(data.amount),
     status:data.isCompleted?"Completed":"Pending",
     desc:data.description,
     reciptant:data.reciptent
    }
}