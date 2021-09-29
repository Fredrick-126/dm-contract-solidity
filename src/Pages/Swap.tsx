import React,{useState,useEffect} from 'react';
/* import { useSelector} from 'react-redux'; */

import Layout from '../components/Layout';

import imgBgCell from '../assets/bg-cell.webp';

import imgBG01 from '../assets/swap-bg-01.webp';
/* import imgBG02 from '../assets/swap-bg-02.webp'; */
import imgBG03 from '../assets/swap-bg-03.webp';
import imgIC01 from '../assets/swap-ic-01.webp';
import imgIC02 from '../assets/swap-ic-02.webp';
import imgICExchange from '../assets/swap-ic-exchange.webp';
import {ethers} from "ethers"
import {useWallet} from 'use-wallet';
import {DMTokenContract,USDTContract,ExchangeRouter} from "../contracts";

const Swap = () => {
	const wallet = useWallet();

	const [token1Status,setToken1Status] = useState({
		token:"DMToken",
		amount:0
	})
	
	const [token2Status,setToken2Status] = useState({
		token:"USDT",
		amount:0
	})

	const [focus,setFocus] = useState(0)
	const [loading,setLoading] = useState(false);

	const tokenData = {
		USDT : {
			contract:USDTContract,
			address:USDTContract.address,
			decimals:6
		},
		DMToken : {
			contract:DMTokenContract,
			address:DMTokenContract.address,
			decimals:18
		}
	}

  	const getAmountIn =  ()=>{
        var path = [tokenData[token1Status.token].address,tokenData[token2Status.token].address];
		let decimals1 = tokenData[token1Status.token].decimals;
		let decimals2 = tokenData[token2Status.token].decimals;
        
		var amount2 = token2Status.amount;
		if(token1Status.token === "DMToken"){
			amount2 = amount2/0.85;
		}
        ExchangeRouter.getAmountsIn(ethers.utils.parseUnits((Number(amount2).toFixed(decimals2)).toString(),decimals2),path)
		.then((pairData)=>{
			if(pairData!=null){
				let amout = parseFloat(Number(ethers.utils.formatUnits(pairData[0],decimals1)).toFixed(8));
				setToken1Status({...token1Status,amount:amout});
			}
		})
        .catch((err)=>{
            //console.log(err);
            setToken1Status({...token1Status,amount:0});
        });

    }

	const getAmountOut = ()=>{
        var path = [tokenData[token1Status.token].address,tokenData[token2Status.token].address];
		let decimals1 = tokenData[token1Status.token].decimals;
		let decimals2 = tokenData[token2Status.token].decimals;

		console.log("get amount out : ",path,token1Status.amount,ethers.utils.parseUnits((Number(token1Status.amount).toFixed(decimals1)).toString(),decimals1).toString());
        ExchangeRouter.getAmountsOut(ethers.utils.parseUnits((Number(token1Status.amount).toFixed(decimals1)).toString(),decimals1),path)
		.then((pairData)=>{
			if(pairData!=null){
				//fee rate
				let amount = parseFloat(Number(ethers.utils.formatUnits(pairData[1],decimals2)).toFixed(8));
				if(token1Status.token == "USDT"){
					console.log("pair reserves :",pairData[0].toString(),pairData[1].toString())
				setToken2Status({...token2Status,amount:amount});
				}
				else {
					//15% fee rate
					amount = amount*0.85;
					setToken2Status({...token2Status,amount:amount});
				}
			}
		})
        .catch((err)=>{
            // console.log(err);
			setToken2Status({...token2Status,amount:0});  
        });
    }

	useEffect(()=>{
		// console.log("token1 changed",token1Status.amount)
		if(focus === 0){
			getAmountOut();
		}
	},[token1Status.amount])

	useEffect(()=>{
		// console.log("token2 changed",token2Status.amount,focus)
		if(focus === 1){
			getAmountIn();
		}
	},[token2Status.amount])


	const handleChangeTokens = ()=>{
		setFocus(0);
		setToken2Status({token:token1Status.token,amount:token1Status.amount});
		setToken1Status({...token1Status,token:token2Status.token});
	}

	const handleSwap = async ()=>{
		if(loading!==true&&wallet.status==="connected"&&token1Status.amount!==0&&token2Status.amount!==0){
			const provider = new ethers.providers.Web3Provider(wallet.ethereum);
			const signer =await provider.getSigner();
			let swapAmount = ethers.utils.parseUnits((token1Status.amount).toString(),tokenData[token1Status.token].decimals)

			const sigendContract = tokenData[token1Status.token].contract.connect(signer);
			var allowance =await sigendContract.allowance(wallet.account,ExchangeRouter.address);
			if(allowance<swapAmount) {
				var tx = await sigendContract.approve(ExchangeRouter.address,swapAmount.sub(allowance))
					.catch((err)=>{
						//console.log(err);
						setLoading(false)
					});
				if(tx!=null){
					await tx.wait();
					swapToken();
				}
			}
			else {
				swapToken();
			}
		}
		else {
			alert("OOPs, Something wrong!");
		}
	}

	const swapToken =async ()=>{
		const provider = new ethers.providers.Web3Provider(wallet.ethereum);
		const signer =await provider.getSigner();
		
		//exchange parameters
        var path = [tokenData[token1Status.token].address,tokenData[token2Status.token].address];
		let swapAmount = ethers.utils.parseUnits((token1Status.amount).toString(),tokenData[token1Status.token].decimals);
        var date=new Date();
        var seconds = Math.floor(date.getTime() / 1000)+1000000;


		const sigendExchangeContract = ExchangeRouter.connect(signer);
		var tx = await sigendExchangeContract.swapExactTokensForTokens(swapAmount,0,path,wallet.account,seconds)
		.catch((err)=>{
			console.log(err)
			setLoading(false);
		})
		if(tx!=null){
            await tx.wait();
            setLoading(false);
        }
	}

	const handleAmount1 = async (e:any)=>{
		setFocus(0)
		if(Number(e.target.value)<0){
			setToken1Status({...token1Status,amount:0})
		}
		else {
			var amount = parseFloat(Number(e.target.value).toFixed(8))
			setToken1Status({...token1Status,amount:amount})
		}
	}

	const handleAmount2 = async (e:any)=>{
		setFocus(1)
		if(Number(e.target.value)<0){
			setToken2Status({...token2Status,amount:0})
		}
		else {
			var amount = parseFloat(Number(e.target.value).toFixed(8))
			setToken2Status({...token2Status,amount:amount})
		}
	}

	/* const L = useSelector(state => state.contract.L); */
	return <Layout className="swap">
		<div style={{position:'relative'}}>
			<div>
				<img src={imgBG01} alt="bg" style={{width:'100%',height:'auto'}} />
			</div>
			<div style={{position:'absolute',left:0, right:0, top:0, bottom:0, display:'flex', alignItems:'center', justifyContent: 'center',padding:10}}>
				<img src={imgIC01} alt="icon" style={{width:'6em',height:'auto'}} />
				<h2>兑换获得奖励</h2>
			</div>
		</div>
		<div className="mt-3" style={{backgroundColor:'#363d50',borderRadius: 5, padding: 10}}>
			<h3 className="text-center">授权钱包</h3>
			<div>{token1Status.token}</div>
			<div style={{position:'relative',border:'1px solid gray', padding: 10}}>
				<input onChange={handleAmount1} type="number" value={parseFloat(Number(token1Status.amount).toFixed(8))} className="h3" style={{marginBottom:0}} maxLength={12} />
				<button className="btn btn-sm btn-outline-success" style={{position:'absolute',right:10}}>选择通证</button>
			</div>
			<p className="text-center mt-3"><img src={imgICExchange}  alt="icon" style={{width:'1.5em',height:'auto'}} onClick = {handleChangeTokens}/></p>
			<div>{token2Status.token}</div>
			<div style={{position:'relative',border:'1px solid gray', padding: 10}}>
				<input onChange={handleAmount2} type="number" value={parseFloat(Number(token2Status.amount).toFixed(8))} className="h3" style={{marginBottom:0}} maxLength={12} />
				<button className="btn btn-sm btn-outline-success" style={{position:'absolute',right:10}}>MAX</button>
			</div>
			<div className="text-center mt-3">
				<button className="btn btn-success px-5 round" onClick = {handleSwap}>输入金额</button>
			</div>
		</div>
		<div className="mt-3" style={{position:'relative'}}>
			<div style={{opacity:0.8}}>
				<img src={imgBgCell} alt="bg" style={{width:'100%',height:'auto'}} />
			</div>
			<div style={{position:'absolute',left:0, right:0, top:0, bottom:0, display:'flex', alignItems:'center', justifyContent: 'center'}}>
				<h3 style={{marginRight:20}}>交易就送DM</h3>
				<img src={imgIC02} alt="bg" style={{width:'10em',height:'auto'}} />
			</div>
		</div>
		<div className="mt-3" style={{position:'relative'}}>
			<div style={{opacity:0.8}}>
				<img src={imgBG03} alt="bg" style={{width:'100%',height:'auto'}} />
			</div>
			<div style={{position:'absolute',left:0, right:0, top:0, bottom:0, padding: 20, display:'flex', flexDirection:'column'}}>
				<div style={{flexGrow:1}}>
					<h3>权益池</h3>
					<code>180万枚</code>
				</div>
				<div style={{display:'flex',justifyContent:'space-between'}}>
					<span>剩余币量：2600</span>
					<span>总分红币量：2.6W</span>
				</div>
			</div>
		</div>
		<div className="mt-3" style={{position:'relative'}}>
			<div style={{opacity:0.8}}>
				<img src={imgBG03} alt="bg" style={{width:'100%',height:'auto'}} />
			</div>
			<div style={{position:'absolute',left:0, right:0, top:0, bottom:0, padding: 20, display:'flex', flexDirection:'column'}}>
				<div style={{flexGrow:1}}>
					<h3>保险池</h3>
					<code>180万枚</code>
				</div>
				<div style={{display:'flex',justifyContent:'space-between'}}>
					<div className="text-center">回购<br/>1万枚</div>
					<div className="text-center">销毁<br/>1万枚</div>
					<div className="text-center">奖励<br/>18万枚</div>
				</div>
			</div>
		</div>
	</Layout>;
};

export default Swap;