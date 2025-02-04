/* eslint-disable */
import React, { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import { createClient } from '@supabase/supabase-js';
import { useParams } from 'react-router-dom';
import { Button, Paper, Typography, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { styled as makeStyles } from '@mui/system';
import Pagination from '@mui/material/Pagination';
import ScaleLoader from 'react-spinners/ScaleLoader';
// import '../css/main.css';
import { ethers } from 'ethers';
import { toast, ToastContainer } from 'react-toastify';
import Repay from '../../components/Repay';




const supabaseUrl = "https://lmsbzqlwsedldqxqwzlv.supabase.co"
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxtc2J6cWx3c2VkbGRxeHF3emx2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE2OTc5ODA2MTEsImV4cCI6MjAxMzU1NjYxMX0.-qVOdECSW9hfokq8N99gCH2BZYpWooXy7zOz1e6fBHM"
const supabase = createClient(supabaseUrl, supabaseKey);
import contractABI from '../../ABIs/escrow2.json';


const provider = new ethers.providers.Web3Provider(window.ethereum);


const useStyles = makeStyles((theme) => ({
  paper: {
    padding: theme.spacing(2),
    marginBottom: theme.spacing(2),
  },
  actionButtons: {
    marginTop: theme.spacing(2),
    display: 'flex',
    justifyContent: 'space-between',
  },
  pagination: {
    display: 'flex',
    justifyContent: 'center',
    marginTop: 'theme.spacing(2)',

  },
  dialog: {
    padding: theme.spacing(2),
  },
  loanDetailsContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '30px',
    marginTop: '10px',
  },
  loanImage: {
    width: '100%',
    height: '410px',
    objectFit: 'cover',
    borderRadius: '15px',
  },
  progressBarContainer: {
    position: 'relative',
    width: '100%',
    height: '5px',
    backgroundColor: '#3a3a43',
    marginTop: '2px',
  },
  progressBar: {
    position: 'absolute',
    height: '100%',
    backgroundColor: '#4acd8d',
  },
  countBoxContainer: {
    display: 'flex',
    width: '100%',
    justifyContent: 'space-between',
    gap: '30px',
  },
}));

const ViewLoan = () => {
  const classes = useStyles();
  const [loansData, setLoansData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [acceptingLoan, setAcceptingLoan] = useState(false); // New state for loading during acceptance
  const [marketDetails, setMarketDetails] = useState(null);

  const loansPerPage = 9;
  const MID = useParams();

  useEffect(() => {

    const loadMarketDetails = async (marketID) => {
      try {
        const { data: Market, error } = await supabase
          .from('Markets')
          .select('*')
          .eq('id', marketID);
  
        if (error) {
          console.error('Error loading data from Supabase:', error);
          toast.error('Error loading data. Please try again.'); // Display error toast
        } else if (Market && Market.length > 0) {
          setMarketDetails(Market[0]);
        } else {
          console.warn('No market details found for ID:', marketID);
          toast.warn('No market details found.'); // Display warning toast
        }
      } catch (error) {
        console.error('Unexpected error while loading market details:', error);
        toast.error('Unexpected error. Please try again.'); // Display error toast
      }
    };
    const loadLoans = async () => {
      await loadMarketDetails(MID.market);
      const { data: LoanBid, error } = await supabase
        .from('LoanBid')
        .select('*')
        .match({ MarketplaceID: MID.market });

      if (error) {
        setError('Error loading loans. Please try again later.');
      } else {
        setLoading(false);
        setLoansData(LoanBid);
      }
    };

    loadLoans();
  }, [MID.market]);

  const loanImages = [
    'https://i.ibb.co/CzzXqK6/7xm-xyz648911.png',
    'https://i.ibb.co/71Smg2m/7xm-xyz113336.png',
    'https://i.ibb.co/sJVHJRC/ETH-in-air.png',
    'https://i.ibb.co/ZMwrKZV/Ethereum.png',
    'https://i.ibb.co/k88Xny4/7xm-xyz978597.png',
    'https://i.ibb.co/YBV8nCr/Vector-2646.jpg',
    'https://i.ibb.co/cN2vqMP/7xm-xyz786284.jpg',
  ];


  const handleLoanDetailsClick = (loan) => {
    setSelectedLoan(loan);
    setDialogOpen(true);
  };

  const toggleShowAcceptedLoans = () => {
    setShowAccepted((prevValue) => !prevValue);
   
  };



  const fetchCollateral = async (selLoan) => {
    try {
      setAcceptingLoan(true); 
      setDialogOpen(false);
      console.log(selLoan);

        const signer = provider.getSigner();
        const contractAddress = '0x53c1f38ad0e8c6c3589abb6707ddd50d98022021'; 
        const contract = new ethers.Contract(contractAddress, contractABI, signer);
        

        const walletAddress = await signer.getAddress();

        console.log('Sending funds to:', walletAddress);

        const ethAmount = ethers.utils.parseEther(selLoan.CollateralAmount);
        console.log('amount', ethAmount);

        const transactionResponse = await contract.withdrawETH(ethAmount);
        await transactionResponse.wait();

        console.log('Funds transferred successfully');
        toast.success('Collateral Claimed successfully');

        setAcceptingLoan(false); 
    } catch (error) {
        console.error('Failed to send funds:', error);
        setAcceptingLoan(false); 
        toast.error(`Error claiming collateral`);
    }
};









  const handleFilterChange = (event) => {
    setFilterStatus(event.target.value);
  };



  
  // Function to filter loans based on their status
  const filterLoansByStatus = () => {
    let filteredLoans = loansData;

    if (filterStatus !== 'All') {
      filteredLoans = loansData.filter((loan) => {
        return filterStatus === 'Accepted' ? loan.Status === 'Accepted' : loan.Status === 'Pending';
      });
    }

    return (
      <div className="row" style={{ display: 'flex', flexWrap: 'wrap', gap: '40px' }}>
        {filteredLoans.map((data, index) => (
          
           <div key={`loan-${index}`} style={{ width: '30%', marginBottom: '16px', marginLeft: "20px", position: 'relative', top: '30px' }} >
            <Paper
              style={{
                padding: '16px',
                borderRadius: '15px',
                cursor: 'pointer',
                boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.1)',
                backgroundColor: '#DCC7C2', // Add background color here
              }}
              onClick={() => handleLoanDetailsClick(data)}
              elevation={3}
            >
              <img
              src={loanImages[index % loanImages.length]} // Use the image based on the index
              alt={`Loan-${index}`}
              border="0"
              style={{ width: '100%', height: '158px', objectFit: 'cover', borderRadius: '15px', marginBottom: '12px' }}
            />

              <div style={{ display: 'flex', flexDirection: 'column', paddingTop: '12px' }}>
                <div style={{ display: 'block' }}>
                  <h3 style={{ fontFamily: 'epilogue', fontWeight: 'bold', fontSize: '18px', color: '#000000', textAlign: 'left', lineHeight: '30px', marginBottom: '5px' }}>
                    APR: <span style={{ color: '#000000', fontWeight: 'bold' }}>{data.APR}</span>
                  </h3>
                  <p style={{ marginTop: '5px', fontFamily: 'epilogue', fontWeight: 'bold', fontSize: '14px', color: '#000000', textAlign: 'left', lineHeight: '22px' }}>
                    Principal: {data.Principal}
                  </p>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', marginTop: '15px', gap: '8px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <h4 style={{ fontFamily: 'epilogue', fontWeight: 'semibold', fontSize: '24px', color: '#000000', lineHeight: '24px' }}>{data.CollateralAmount}</h4>
                    <p style={{ marginTop: '3px', fontFamily: 'epilogue', fontWeight: 'bold', fontSize: '14px', color: '#000000', maxWidth: '120px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      amount of {data.CollateralAddress}
                    </p>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <h4 style={{ fontFamily: 'epilogue', fontWeight: 'semibold', fontSize: '24px', color: '#000000', lineHeight: '24px' }}>{data.Duration}</h4>
                    <p style={{ marginTop: '3px', fontFamily: 'epilogue', fontWeight: 'bold', fontSize: '14px', color: '#000000', maxWidth: '120px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      Seconds
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', marginTop: '20px', gap: '12px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#13131a' }}>
                    <img src="https://i.ibb.co/DL3dtSj/avatar2-0.png" border="0" alt="user" className="object-contain w-1/2 h-1/2" />
                  </div>
                  <p style={{ marginTop: '3px', fontFamily: 'epilogue', fontWeight: 'bold', fontSize: '14px', color: '#000000', maxWidth: '120px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    by {data.RecieverAddress}
                  </p>
                </div>
              </div>

              {/* Status Indicator */}
              <div
                className="status-indicator"
                style={{
                  position: 'absolute',
                  bottom: 0,
                  right: '6.8px', // Adjust the value as needed
                  color: data.Status === 'Pending' ? 'Purple' : 
       (data.Status === 'Accepted' ? 'Green' : 
       (data.Status === 'Repaid' ? 'Green' : 'Red')),

                  textAlign: 'right',
                  padding: '22px',
                  fontWeight: 'bold',
                }}
              >
                {data.Status}
              </div>
            </Paper>
          </div>
        
        ))}
      </div>
    );
  };


  const handleCloseDialog = () => {
    setDialogOpen(false);
  };

  const acceptLoan = async (loanID) => {
    try {
      setAcceptingLoan(true); // Set loading state to true
      setDialogOpen(false); // Close the dialog after accepting the loan

      if (window.ethereum) {
        await window.ethereum.enable();
        // const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();

        const selectedLoan = loansData.find((loan) => loan.LoanID === loanID);
        const accounts = await provider.listAccounts();
        const senderAddress = accounts[0];

        if (!senderAddress) {
          toast.error('MetaMask account not available');
          return;
        }

        const amountToSend = ethers.utils.parseEther(selectedLoan.Principal);

        console.log("amountToSend", selectedLoan.Principal);
        console.log("RecieverAddress", selectedLoan.RecieverAddress);
        console.log("senderAddress", senderAddress);



        const txEth = await signer.sendTransaction({
          to: selectedLoan.RecieverAddress,
          value: amountToSend,
        });

        await txEth.wait();

        // Update Supabase fields after successful transaction
        const { data: updatedLoan, error } = await supabase
          .from('LoanBid')
          .update({
            LenderAddress: senderAddress,
            LoanLendTime: new Date().toISOString(), // You might want to format this date according to your needs
            Status: 'Accepted', // Update the status to indicate that the loan is accepted
            Brr: 0.1,
          })
          .eq('LoanID', loanID);

        if (error) {
          toast.error(`Error while updating database`);
          return;
        }

        setLoansData((prevLoans) => {
          return prevLoans.map((loan) =>
            loan.LoanID === loanID
              ? {
                ...loan,
                LenderAddress: senderAddress,
                LoanLendTime: new Date().toISOString(),
                Status: 'Accepted',
              }
              : loan
          );
        });

        setAcceptingLoan(false); // Set loading state back to false after loan acceptance
        toast.success('Loan bid accepted successfully');

      } else {
        toast.error('MetaMask not detected');
        setAcceptingLoan(false); // Set loading state to false in case of an error

      }
    } catch (error) {
      toast.error(`Error accepting loan`);
      setAcceptingLoan(false); // Set loading state to false in case of an error
    

    }
  };



  const handlePageChange = (event, page) => {
    setCurrentPage(page);
  };

  const indexOfLastLoan = currentPage * loansPerPage;
  const indexOfFirstLoan = indexOfLastLoan - loansPerPage;
  const currentLoans = loansData.slice(indexOfFirstLoan, indexOfLastLoan);

  const totalPages = Math.ceil(loansData.length / loansPerPage);

  const renderLoans = () => {
    return (
      <div className="row" style={{ display: 'flex', flexWrap: 'wrap', gap: '2%' }}>
        {loading && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'transparent',
            zIndex: 9999,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}>
            <ScaleLoader color={"#123abc"} loading={loading} size={22} />
          </div>
        )}

        {!loading && currentLoans.length > 0 && currentLoans.map((data, index) => (
          // if loan.Status is 'Cancelled;, do not show the loan
          data.Status !== 'Cancelled' &&
          (
            <div style={{ width: '30%', marginBottom: '16px', position: 'relative' }} key={`loan-${index}`}>
              <Paper
                style={{
                  padding: '16px',
                  borderRadius: '15px',
                  cursor: 'pointer',
                  boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.1)',
                  backgroundColor: '#DCC7C2', // Add background color here
                }}
                onClick={() => handleLoanDetailsClick(data)}
                elevation={3}
              >
                <img
                  src={loanImages[index % loanImages.length]} // Use the image based on the index
                  alt={`Loan-${index}`}
                  border="0"
                  style={{ width: '100%', height: '158px', objectFit: 'cover', borderRadius: '15px', marginBottom: '12px' }}
                />

                <div style={{ display: 'flex', flexDirection: 'column', paddingTop: '12px' }}>
                  <div style={{ display: 'block' }}>
                    <h3 style={{ fontFamily: 'epilogue', fontWeight: 'bold', fontSize: '18px', color: '#000000', textAlign: 'left', lineHeight: '30px', marginBottom: '5px' }}>
                      APR: <span style={{ color: '#000000', fontWeight: 'bold' }}>{data.APR}</span>
                    </h3>
                    <p style={{ marginTop: '5px', fontFamily: 'epilogue', fontWeight: 'bold', fontSize: '14px', color: '#000000', textAlign: 'left', lineHeight: '22px' }}>
                      Principal: {data.Principal}
                    </p>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', marginTop: '15px', gap: '8px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <h4 style={{ fontFamily: 'epilogue', fontWeight: 'semibold', fontSize: '24px', color: '#000000', lineHeight: '24px' }}>{data.CollateralAmount}</h4>
                      <p style={{ marginTop: '3px', fontFamily: 'epilogue', fontWeight: 'bold', fontSize: '14px', color: '#000000', maxWidth: '120px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        amount of {data.CollateralAddress}
                      </p>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <h4 style={{ fontFamily: 'epilogue', fontWeight: 'semibold', fontSize: '24px', color: '#000000', lineHeight: '24px' }}>{data.Duration}</h4>
                      <p style={{ marginTop: '3px', fontFamily: 'epilogue', fontWeight: 'bold', fontSize: '14px', color: '#000000', maxWidth: '120px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        Seconds
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', marginTop: '20px', gap: '12px' }}>
                    <div style={{ width: '50px', height: '50px',display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <img src="https://i.ibb.co/DL3dtSj/avatar2-0.png" border="0" alt="user" className="object-contain h-auto w-75" />
                    </div>
                    <p style={{ marginTop: '3px', fontFamily: 'epilogue', fontWeight: 'bold', fontSize: '14px', color: '#000000', maxWidth: '120px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      by {data.BorrowerAddress}
                    </p>
                  </div>
                </div>

                {/* Status Indicator */}
                <div
                  className="status-indicator"
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    right: '6.8px', // Adjust the value as needed
                    color: data.Status === 'Pending' ? 'Purple' : 
                    (data.Status === 'Accepted' ? 'Green' : 
                    (data.Status === 'Repaid' ? '#8D4004' : 'Red')),
                                 textAlign: 'right',
                    padding: '22px',
                    fontWeight: 'bold',
                  }}
                >
                  {data.Status}
                </div>

              </Paper>
            </div>
          )
        ))}

        {!loading && currentLoans.length === 0 && (
          <div className="col-md-12 col-sm-12">
            <div className="feature-box">
              <div className="icon">
                <i className="lni lni-rocket"></i>
              </div>
              <Typography variant="h5">There are no loans available</Typography>
            </div>
          </div>
        )}
      </div>
    );
  };

  const liquidateLoan = async (loanID) => {
    try {
      setAcceptingLoan(true); // Set loading state to true
      setDialogOpen(false); // Close the dialog after accepting the loan

      if (window.ethereum) {
        await window.ethereum.enable();
        // const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();

        const selectedLoan = loansData.find((loan) => loan.LoanID === loanID);
        const accounts = await provider.listAccounts();
        const senderAddress = accounts[0];

        if (!senderAddress) {
          toast.error('MetaMask account not available');
          return;
        }

        const amountToSend = ethers.utils.parseEther(selectedLoan.Principal);

        const txEth = await signer.sendTransaction({
          to: selectedLoan.LenderAddress,
          value: amountToSend,
        });

        await txEth.wait();  

        // Update Supabase fields after successful transaction
        const { data: updatedLoan, error } = await supabase
          .from('LoanBid')
          .update({
            Status: 'Liquidated', // Update the status to indicate that the loan is accepted
          })
          .eq('LoanID', loanID);

        if (error) {
          toast.error('Error updating blockchain:', error);
          return;
        }

        setLoansData((prevLoans) => {
          return prevLoans.map((loan) =>
            loan.LoanID === loanID
              ? {
                ...loan,
                Status: 'Liquidated',
              }
              : loan
          );
        });
        toast.success('Loan liquidated successfully');

        setAcceptingLoan(false); // Set loading state back to false after loan acceptance

      } else {
        toast.error('MetaMask not detected');
        setAcceptingLoan(false); // Set loading state to false in case of an error

      }
    } catch (error) {
      toast.error(`Error while liquidating loan`);
      setAcceptingLoan(false); // Set loading state to false in case of an error


    }
  };

  const [currentAccountAddress, setCurrentAccountAddress] = useState(null); // Add state for current account address

  useEffect(() => {
    const fetchAccountAddress = async () => {
      if (window.ethereum) {
        // const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const accountAddress = await signer.getAddress();

        console.log('Account Address:', accountAddress);
        setCurrentAccountAddress(accountAddress);
      }
    };

    fetchAccountAddress();
  }, []);

  const payMarket = async (loanFee) => {
    try {
      const feePercent = Number(marketDetails.Fee)/100;
      const feeValue = Number(loanFee.Principal) * feePercent;
      const fee = feeValue.toString();
      const feeAmount = ethers.utils.parseEther(fee);
      console.log("Fee to send to Market Owner: ", feeAmount, " ethers.");

      console.log('Sending Fee to Market Owner...');
      const txEthFee = await provider.getSigner().sendTransaction({
        to: marketDetails.owner,
        value: feeAmount,
      });
      await txEthFee.wait();
      console.log('Fee sent successfully to market owner.');

      // // Update the Tax Collected for the market owner
      const { data: feeUpdateData, error: feeUpdateError } = await supabase
        .from('Markets')
        .update({ TaxCollected: feeAmount }) // This is pseudo-code; actual syntax will depend on your table structure
        .eq('owner', marketDetails.id); // Assuming `ownerId` is how you link to the specific market owner

      // // Update Loan Status
      const { error: updateLoanError } = await supabase
        .from('LoanBid')
        .update({ Status: 'Repaid' })
        .eq('LoanID', loanFee.LoanID);

      if (feeUpdateError) throw new Error('Failed to update market owner fee in Supabase.');

      console.log('Market owner fee updated in database.', feeUpdateData);
    }
    catch (error) {
      console.error('Failed to send funds:', error);
      toast.error(`Error paying market fee`);
    }
  }

  const cancelLoan = async (loanID) => {
    try {
      setAcceptingLoan(true); // Set loading state to true
      setDialogOpen(false); // Close the dialog after accepting the loan
  
      if (window.ethereum) {
        await window.ethereum.enable();
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
  
        const accounts = await provider.listAccounts();
        const senderAddress = accounts[0];
  
        if (!senderAddress) {
          toast.error('MetaMask account not available');
          return;
        }
  
        // Prompt the user to sign the cancellation message
        const cancellationMessage = `Cancel loan ${loanID}`;
        const signature = await signer.signMessage(cancellationMessage);
  
        // Update Supabase fields after successful cancellation
        const { data: updatedLoan, error } = await supabase
          .from('LoanBid')
          .update({
            Status: 'Cancelled',    
          })
          .eq('LoanID', loanID);
  
        if (error) {
          toast.error( 'Error while verifying signature Please try again' );
         
          setAcceptingLoan(false); // Set loading state to false in case of an error

          return;
        }
  
        setLoansData((prevLoans) => {
          return prevLoans.map((loan) =>
            loan.LoanID === loanID
              ? {
                  ...loan,
                  Status: 'Cancelled',
                  Signature: signature, // Update the local state with the signature
                }
              : loan
          );
        });
  
        setTimeout(() => {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }, 100);
        
        toast.success('Loan bid cancelled successfully');
        setAcceptingLoan(false); // Set loading state back to false after loan cancellation
      } else {
        toast.error('MetaMask not detected');
        setAcceptingLoan(false); // Set loading state to false in case of an error
      }
    } catch (error) {
      toast.error(`Error cancelling loan`);
      setAcceptingLoan(false); // Set loading state to false in case of an error
    }
  };
  
  


  const renderLoanDetailsDialog = () => (
    <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth     PaperProps={{ style: { borderRadius: '20px' } }} // Add this line
    >
      <DialogTitle style={{ background: '#4f4f4f', color: 'white' }}>Loan Details</DialogTitle>
      <DialogContent className={classes.dialog} dividers style={{ background: '#272727', color: 'white' }}>
        {selectedLoan && (
          <>
            {/* Status Indicator */}
            <div
              className="status-indicator"
              style={{
                color: selectedLoan.Status === 'Pending' ? 'Purple' : (selectedLoan.Status === 'Accepted' ? 'Green' : 'Red'),
                textAlign: 'right',
                display: 'flex-right',
              }}
            >
              {selectedLoan.Status}
            </div>

            {/* Loan Details */}
            <Typography variant="body1">
              <strong>Receiver Address:</strong> {selectedLoan.RecieverAddress}
            </Typography>
            <Typography variant="body1">
              <strong>Borrower Address:</strong> {selectedLoan.BorrowerAddress}
            </Typography>
            <Typography variant="body1">
              <strong>APR:</strong> {selectedLoan.APR}
            </Typography>
            <Typography variant="body1">
              <strong>Duration:</strong> {selectedLoan.Duration}
            </Typography>
            <Typography variant="body1">
              <strong>Principal:</strong> {selectedLoan.Principal}
            </Typography>
            <Typography variant="body1">
              <strong>Collateral Type:</strong> {selectedLoan.CollateralType}
            </Typography>
            <Typography variant="body1">
              <strong>Collateral Amount:</strong> {selectedLoan.CollateralAmount}
            </Typography>
            <Typography variant="body1">
              <strong>Collateral Address:</strong> {selectedLoan.CollateralAddress}
            </Typography>

            {/* Divider */}
            <hr style={{ margin: '16px 0', borderColor: '#5f5f5f' }} />

            {/* Lender Details */}
            <DialogTitle style={{ background: '#4f4f4f', color: 'white', borderRadius: '20px'}}>Lender Details</DialogTitle>
            <DialogContent className={classes.dialog} dividers style={{ background: '#272727', color: 'white' }}>
              {selectedLoan.LenderAddress === null ? (
                <Typography variant="h5">Not yet accepted</Typography>
              ) : (
                <>
                  <Typography variant="body1">
                    <strong>Lender Address:</strong> {selectedLoan.LenderAddress}
                  </Typography>
                  <Typography variant="body1">
                    <strong>Loan Lent at:</strong> {selectedLoan.LoanLendTime}
                  </Typography>
                </>
              )}
            </DialogContent>
          </>
        )}
      </DialogContent>

      

      <DialogActions style={{ background: '#4f4f4f', justifyContent: 'center' }}>
      <Button
  onClick={handleCloseDialog}
  color="primary"
  variant="contained"
  sx={{ borderRadius: '19px' }} // Custom border radius
>
  Close
</Button>

  {selectedLoan?.BorrowerAddress === currentAccountAddress && selectedLoan?.Status === 'Pending' && (
    <Button
      variant="contained"
      color="primary"
      onClick={() => cancelLoan(selectedLoan.LoanID)}
      sx={{ borderRadius: '17px' }} // Custom border radius

    >
      Cancel Loan Bid
    </Button>
  )}
  {selectedLoan?.Status === 'Pending'  && selectedLoan?.BorrowerAddress !== currentAccountAddress && (
    <Button
      variant="contained"
      color="primary"
      onClick={() => acceptLoan(selectedLoan?.LoanID)}
    >
      Accept Loan Bid
    </Button>
  )}
  {selectedLoan?.Status === 'Accepted' && selectedLoan?.BorrowerAddress !== currentAccountAddress && (
    <Button
      variant="contained"
      color="primary"
      onClick={() => liquidateLoan(selectedLoan?.LoanID)}
      disabled={!isLiquidateEnabled(selectedLoan)}
    >
      Liquidate
    </Button>
  )}
  {selectedLoan?.Status === 'Paying Market' && selectedLoan.Repaid === selectedLoan.Principal && selectedLoan?.BorrowerAddress === currentAccountAddress && (
    <Button
      variant="contained"
      color="primary"
      onClick={() => payMarket(selectedLoan)}
      sx={{ borderRadius: '17px' }} // Custom border radius

    >
      Pay Market Fee
    </Button>
  )}
  {selectedLoan?.Status === 'Repaid' && selectedLoan.Repaid === selectedLoan.Principal && selectedLoan?.BorrowerAddress === currentAccountAddress && (
    <Button
      variant="contained"
      color="primary"
      onClick={() => fetchCollateral(selectedLoan)}
      sx={{ borderRadius: '17px' }} // Custom border radius

    >
      Claim Collateral
    </Button>
  )}
  {selectedLoan?.BorrowerAddress === currentAccountAddress && (selectedLoan?.Status.toLowerCase() === 'accepted' || selectedLoan?.Status.includes('% Repaid')) && (
    <>
      <Repay selectedLoan={selectedLoan} marketDetails={marketDetails} />
    </>
  )}
</DialogActions>



    </Dialog>
  );

  const isLiquidateEnabled = (loan) => {
    if (!loan) {
      return false;
    }

    const loanEndTime = new Date(loan.LoanLendTime).getTime();
    const currentTime = new Date().getTime();
    const durationInSeconds = parseInt(loan.Duration, 10);

    // Calculate the time when liquidation is allowed
    const liquidationTime = loanEndTime + durationInSeconds * 1000;

    // Enable the button if the current time is equal to or greater than the liquidation time
    return currentTime >= liquidationTime;
  };

  return (
    <Layout>
      {marketDetails && !marketDetails.isClosed ? (
        <>
          <div style={{ paddingTop: '10%' }}>
            <Typography variant="h3" style={{ color: 'black', textAlign: 'center' }}>
              <strong>Loans in Market</strong>
            </Typography>

            <div className="feature section">
              <div className="container">
                {acceptingLoan && (
                  <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    backgroundColor: 'transparent', // Semi-transparent white background
                    zIndex: 9999,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center'
                  }}>
                    <ScaleLoader color={"#123abc"} loading={acceptingLoan} size={22} />
                  </div>
                )}

                {loading && (
                  <iframe title="Loading" src="https://lottie.host/?file=474793e3-81ee-474c-bc0b-78562b8fa02e/dwOgWo0OlT.json"></iframe>
                )}
                {error && <p>{error}</p>}

                {!loading && loansData.length > 0 ? (
                  renderLoans()
                ) : (
                  <div className="col-md-12 col-sm-12">
                    <div className="feature-box">
                      <div className="icon">
                        <i className="lni lni-rocket"></i>
                      </div>
                      <Typography variant="h5">There are no loans available</Typography>
                    </div>
                  </div>
                )}

                <div className={classes.pagination} style={{ position: 'absolute', right: '45%', bottom: '7%' }}>
                  {totalPages > 1 && (
                    <Pagination
                      count={totalPages}
                      page={currentPage}
                      onChange={handlePageChange}
                      color="primary"
                      shape="rounded"
                      showFirstButton
                      showLastButton
                    />
                  )}
                </div>
                {/* Loan Details Dialog */}
                {renderLoanDetailsDialog()}
              </div>
            </div>
          </div>
          <ToastContainer
            position="top-right"
            autoClose={5000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="colored"
          />
        </>
      ) : (
          <iframe
          src="https://lottie.host/embed/7207cecd-7148-4266-ac54-38484060dc56/a9kOWn6XTr.json"
          style={{ width: '100%', height: '30rem', paddingTop: '10%'}}
          ></iframe>
      )}
    </Layout>
  );
};

export default ViewLoan;