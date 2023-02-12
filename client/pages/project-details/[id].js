import { useRouter } from 'next/router'
import React,{useEffect,useState} from 'react'
import { useSelector } from 'react-redux'
import FundRiserCard from '../../components/FundRiserCard'
import Loader from '../../components/Loader'
import authWrapper from '../../helper/authWrapper'


const ProjectDetails = () => {

  const router = useRouter()
  const { id } = router.query
  const web3 = useSelector(state=>state.web3Reducer.connection)
  const account = useSelector((state) => state.web3Reducer.account);

  const projectsList = useSelector(state=>state.projectReducer.projects)
  const filteredProject = projectsList?.filter(data =>  data.address === id)

  const [withdrawReq, setWithdrawReq] = useState(null)

  useEffect(() => {
    if(id){

      const loadWithdrawRequests = (data) =>{
        setWithdrawReq(data)
      }
      getAllWithdrawRequest(web3,id,loadWithdrawRequests)

    }
  }, [id])
  


  const pushWithdrawRequests = (data) =>{
    if(withdrawReq){
      setWithdrawReq([...withdrawReq,data])
    }else{
      setWithdrawReq([data])
    }
  }

  return (
    <div className="px-2 py-4 flex flex-col lg:px-12 lg:flex-row ">
    <div className="lg:w-7/12 my-2 lg:my-0 lg:mx-2">
        {
          filteredProject?
            <FundRiserCard props={filteredProject[0]} pushWithdrawRequests={pushWithdrawRequests}/>
          :
          <Loader/>
        }

        <div>
          {
            withdrawReq?
              withdrawReq.length > 0?
                <div>
                  <h1 className="font-sans text-xl text-gray font-semibold">Withdraw requests</h1>
                  {
                    withdrawReq.map((data,i)=>(
                      <div> data </div>
                      // <WithdrawRequestCard props={data} withdrawReq={withdrawReq} setWithdrawReq={setWithdrawReq} contractAddress={id} key={i}/>
                    ))
                  }
                  
                </div>
              :<p>Withdraw requests not found</p>
            :<Loader/>
          }
          
        </div>

    </div>
 
  </div>
  )
}

export default authWrapper(ProjectDetails)