import React, { useState } from "react";
import Link from "next/link";
import { useDispatch, useSelector } from "react-redux";
import {
  contribute,
  createWithdrawRequest,
  requestRefund,
} from "../redux/interactions";
import { etherToWei, state } from "../helper/helper";
import { toastSuccess, toastError } from "../helper/toastMessage";

const colorMaker = (state) => {
  if (state === "Fundraising") {
    return "bg-cyan-500";
  } else if (state === "Expired") {
    return "bg-red-500";
  } else {
    return "bg-emerald-500";
  }
};

const FundRiserCard = ({ props, pushWithdrawRequests }) => {
  const [btnLoader, setBtnLoader] = useState(false);
  const [amount, setAmount] = useState(0);
  const [withDrawDesc, setWithDrawDesc] = useState("");
  const [proofFile, setProofFile] = useState(null);
  const [createObjectURL, setCreateObjectURL] = useState(null);
  const dispatch = useDispatch();
  const charityFundingContract = useSelector(
    (state) => state.fundingReducer.contract
  );
  const account = useSelector((state) => state.web3Reducer.account);
  const web3 = useSelector((state) => state.web3Reducer.connection);
  const uploadToClient = (event) => {
    if (event.target.files && event.target.files[0]) {
      const i = event.target.files[0];
      setProofFile(i);
      setCreateObjectURL(URL.createObjectURL(i));
    }
  };
  const contributeAmount = (projectId, minContribution) => {
    if (parseInt(amount) < parseInt(minContribution)) {
      toastError(
        `Minimum contribution amount is ${minContribution}, ${amount}`
      );
      return;
    }

    setBtnLoader(projectId);
    const contributionAmount = etherToWei(amount);

    const data = {
      contractAddress: projectId,
      amount: contributionAmount,
      account: account,
    };
    const onSuccess = () => {
      setBtnLoader(false);
      setAmount(0);
      toastSuccess(`Successfully contributed ${amount} ETH`);
    };
    const onError = (message) => {
      setBtnLoader(false);
      toastError(message);
    };
    contribute(charityFundingContract, data, dispatch, onSuccess, onError);
  };

  const requestForWithdraw = (projectId) => {
    setBtnLoader(projectId);
    const contributionAmount = etherToWei(amount);

    const data = {
      description: withDrawDesc,
      amount: contributionAmount,
      recipient: account,
      account: account,
      proofFile: proofFile
    };
    const onSuccess = (data) => {
      setBtnLoader(false);
      setAmount(0);
      setCreateObjectURL(null);
      setProofFile(null)
      if (pushWithdrawRequests) {
        pushWithdrawRequests(data);
      }
      toastSuccess(`Successfully requested for withdraw ${amount} ETH`);
    };
    const onError = (message) => {
      setBtnLoader(false);
      toastError(message);
    };
    createWithdrawRequest(web3, projectId, data, onSuccess, onError);
  };
  const requestForRefund = (projectId) => {
    setBtnLoader(projectId);
    const onSuccess = (refundAmount) => {
      setBtnLoader(false);
      toastSuccess(`Successfully refund ${refundAmount} ETH`);
    };
    const onError = (message) => {
      setBtnLoader(false);
      toastError(message);
    };
    const data = {
      account: account,
    };
    requestRefund(web3, projectId, data, onSuccess, onError);
  };
  const allowContributeStates = ["Fundraising"];
  return (
    <div className="card relative overflow-hidden my-4">
      <div className={`ribbon ${colorMaker(props.state)}`}>{props.state}</div>
      <Link href={`/project-details/${props.address}`}>
        <h1 className="font-sans text-xl text-gray font-semibold hover:text-sky-500 hover:cursor-pointer">
          {props.title}
        </h1>
      </Link>
      <p className="font-sans text-sm text-stone-800 tracking-tight">
        <strong>Description:</strong> {props.description}
      </p>
      <p className="font-sans text-sm text-stone-800 tracking-tight">
        <strong>Creator:</strong>{" "}
        <a href={`/projects?creator=${props.creator}`}> {props.creator} </a>
      </p>
      <div className="flex flex-col lg:flex-row">
        <div className="inner-card my-6 w-full lg:w-2/5">
          <p className="text-md font-bold font-sans text-gray">
            Targeted contribution
          </p>
          <p className="text-sm font-bold font-sans text-gray-600 ">
            {props.goalAmount} ETH{" "}
          </p>
          <p className="text-md font-bold font-sans text-gray">Deadline</p>
          <p className="text-sm font-bold font-sans text-gray-600 ">
            {props.deadline}
          </p>
        </div>
        <div className="inner-card my-6 w-full lg:w-3/5">
          {allowContributeStates.includes(props.state) ? (
            <>
              <label className="text-sm text-gray-700 font-semibold">
                Contribution amount :
              </label>
              <div className="flex flex-row">
                <input
                  type="number"
                  placeholder="Type here"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  disabled={btnLoader === props.address}
                  className="input rounded-l-md"
                />

                <button
                  className="button"
                  onClick={() =>
                    contributeAmount(props.address, props.minContribution)
                  }
                  disabled={btnLoader === props.address}
                >
                  {btnLoader === props.address ? "Loading..." : "Contribute"}
                </button>
              </div>
              <p className="text-sm text-red-600">
                {" "}
                <span className="font-bold">NOTE : </span> Minimum contribution
                is {props.minContribution} ETH{" "}
              </p>
            </>
          ) : (
            <>
              <p className="text-md font-bold font-sans text-gray">
                Contract balance
              </p>
              <p className="text-sm font-bold font-sans text-gray-600 ">
                {props.contractBalance} ETH{" "}
              </p>
              {props.creator === account && props.state == "Successful" && props.contractBalance > 0?  (
                <>
                  <label className="text-sm text-gray-700 font-semibold">
                    Withdraw request :
                  </label>
                  <div className="flex flex-row">
                    <input
                      type="number"
                      placeholder="Type here"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      disabled={btnLoader === props.address}
                      className="input rounded-l-md"
                    />
                    <input
                      id="proof-file"
                      type="file"
                      accept="image/jpeg"
                      placeholder="upload proof"
                      onChange={uploadToClient} 
                      disabled={btnLoader === props.address}
                      className="input rounded-l-md"
                    />
                  </div>
                  <textarea
                    type="text"
                    placeholder="Description"
                    value={withDrawDesc}
                    onChange={(e) => setWithDrawDesc(e.target.value)}
                    maxLength="255"
                    disabled={btnLoader === props.address}
                    className="input rounded-l-md"
                  />
                  <img src={createObjectURL} />
                  <button
                    className="button"
                    onClick={() => requestForWithdraw(props.address)}
                  >
                    {btnLoader === props.address ? "Loading..." : "Withdraw"}
                  </button>
                </>
              ) : (
                ""
              )}

              {props.state == "Expired" && props.contributorView == true && props.canRequestRefund == true ? (
                <div className="flex flex-row">
                  <button
                    className="button refundButton"
                    onClick={() => requestForRefund(props.address)}
                    disabled={btnLoader === props.address}
                  >
                    Refund Now
                  </button>
                </div>
              ) : (
                ""
              )}
            </>
          )}
        </div>
      </div>

      {props.state !== "Successful" ? (
        <div className="w-full bg-gray-200 rounded-full">
          <div className="progress" style={{ width: `${props.progress}%` }}>
            {" "}
            {props.progress}%{" "}
          </div>
        </div>
      ) : (
        ""
      )}
    </div>
  );
};

export default FundRiserCard;
