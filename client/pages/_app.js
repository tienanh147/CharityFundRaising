import { useEffect } from "react";
import "../styles/globals.css";
import "react-toastify/dist/ReactToastify.css";
import { ToastContainer } from "react-toastify";
import { wrapper } from "../redux/store";
import { useDispatch } from "react-redux";
import {
  getAllFunding,
  loadAccount,
  loadCharityFundingContract,
  loadWeb3,
  subscribeCharityFundingEvents,
} from "../redux/interactions";
import { Router } from "next/router";
import NProgress from "nprogress";
import "nprogress/nprogress.css";
import { chainOrAccountChangedHandler } from "../helper/helper";

function MyApp({ Component, pageProps }) {
  const dispatch = useDispatch();

  useEffect(() => {
    loadBlockchain();
  }, []);

  const loadBlockchain = async () => {
    const web3 = await loadWeb3(dispatch);
    const account = await loadAccount(web3, dispatch);
    const charityFundingContract = await loadCharityFundingContract(
      web3,
      dispatch
    );
    try {
      await getAllFunding(charityFundingContract, web3, dispatch);
    } catch {}
  };

  Router.events.on("routeChangeStart", () => NProgress.start());
  Router.events.on("routeChangeComplete", () => NProgress.done());
  Router.events.on("routeChangeError", () => NProgress.done());

  useEffect(() => {
    // listen for account changes
    try {
      window.ethereum.on("accountsChanged", chainOrAccountChangedHandler);
      // Listen for chain change
      window.ethereum.on("chainChanged", chainOrAccountChangedHandler);
    } catch {}
  }, []);

  return (
    <>
      <header>
        <script src="https://cdn.jsdelivr.net/npm/webtorrent@latest/webtorrent.min.js"></script>
      </header>
      <ToastContainer />
      <Component {...pageProps} />
    </>
  );
}

export default wrapper.withRedux(MyApp);
