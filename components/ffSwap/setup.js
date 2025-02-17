import React, { useState, useEffect } from 'react';
import {
  TextField,
  Typography,
  InputAdornment,
  Button,
  MenuItem,
  IconButton,
  Dialog,
  CircularProgress,
  Tooltip
} from '@material-ui/core';
import SearchIcon from '@material-ui/icons/Search';
import ArrowDownwardIcon from '@material-ui/icons/ArrowDownward';
import ToggleButton from '@material-ui/lab/ToggleButton';

import { withTheme } from '@material-ui/core/styles';

import { formatCurrency, formatAddress, formatCurrencyWithSymbol, formatCurrencySmall } from '../../utils'

import classes from './swap.module.css'

import stores from '../../stores'
import {
  SWAP_UPDATED,
  ERROR,
  FIXED_FOREX_APPROVE_SWAP,
  FIXED_FOREX_SWAP_APPROVED,
  FIXED_FOREX_SWAP,
  FIXED_FOREX_SWAP_RETURNED,
  FIXED_FOREX_UPDATED,
  FIXED_FOREX_QUOTE_SWAP,
  FIXED_FOREX_QUOTE_SWAP_RETURNED
} from '../../stores/constants'
import BigNumber from 'bignumber.js'

function Setup({ theme, handleNext }) {

  const [, updateState] = React.useState();
  const forceUpdate = React.useCallback(() => updateState({}), []);

  const [ loading, setLoading ] = useState(false)
  const [ approvalLoading, setApprovalLoading ] = useState(false)

  const [ fromAmountValue, setFromAmountValue ] = useState(null)
  const [ fromAmountError, setFromAmountError ] = useState(false)
  const [ fromAssetValue, setFromAssetValue ] = useState(null)
  const [ fromAssetError, setFromAssetError ] = useState(false)
  const [ fromAssetOptions, setFromAssetOptions ] = useState([])

  const [ toAmountValue, setToAmountValue ] = useState(null)
  const [ toAmountError, setToAmountError ] = useState(false)
  const [ toAssetValue, setToAssetValue ] = useState(null)
  const [ toAssetError, setToAssetError ] = useState(false)
  const [ toAssetOptions, setToAssetOptions ] = useState([])

  useEffect(function() {
    const errorReturned = () => {
      setLoading(false)
      setApprovalLoading(false)
    }

    const quoteReturned = (val) => {
      if(val.fromAmount === fromAmountValue && val.toAsset.address === toAssetValue.address) {
        setToAmountValue(val.toAmount)
      }
    }

    const ffUpdated = () => {
      const storeAssets = stores.fixedForexStore.getStore('assets')
      const storeSwapAssets = stores.fixedForexStore.getStore('swapFromAssets')

      setToAssetOptions(storeAssets)
      setFromAssetOptions(storeSwapAssets)

      if(storeAssets.length > 0 && toAssetValue == null) {
        setToAssetValue(storeAssets[0])
      }

      if(storeSwapAssets.length > 0 && fromAssetValue == null) {
        setFromAssetValue(storeSwapAssets[0])
      }

      forceUpdate()
    }

    const approveReturned = (event) => {
      setApprovalLoading(false)
    }

    const swapReturned = (event) => {
      setLoading(false)
      setFromAmountValue('')
      calculateReceiveAmount(0, toAssetValue)
    }

    stores.emitter.on(ERROR, errorReturned)
    stores.emitter.on(FIXED_FOREX_UPDATED, ffUpdated)
    stores.emitter.on(FIXED_FOREX_SWAP_APPROVED, approveReturned)
    stores.emitter.on(FIXED_FOREX_SWAP_RETURNED, swapReturned)
    stores.emitter.on(FIXED_FOREX_QUOTE_SWAP_RETURNED, quoteReturned)

    ffUpdated()

    return () => {
      stores.emitter.removeListener(ERROR, errorReturned)
      stores.emitter.removeListener(FIXED_FOREX_UPDATED, ffUpdated)
      stores.emitter.removeListener(FIXED_FOREX_SWAP_APPROVED, approveReturned)
      stores.emitter.removeListener(FIXED_FOREX_SWAP_RETURNED, swapReturned)
      stores.emitter.removeListener(FIXED_FOREX_QUOTE_SWAP_RETURNED, quoteReturned)
    }
  },[fromAmountValue, toAssetValue]);

  const onAssetSelect = (type, value) => {
    if(type === 'From') {
      setFromAssetValue(value)
      calculateReceiveAmount(fromAmountValue, toAssetValue)
    } else {
      setToAssetValue(value)
      calculateReceiveAmount(fromAmountValue, value)
    }

    forceUpdate()
  }

  const fromAmountChanged = (event) => {
    setFromAmountValue(event.target.value)
    calculateReceiveAmount(event.target.value, toAssetValue)
  }

  const toAmountChanged = (event) => {
  }

  const calculateReceiveAmount = (amount, to) => {
    if(!isNaN(amount) && to != null) {
      stores.dispatcher.dispatch({ type: FIXED_FOREX_QUOTE_SWAP, content: {
        amount: amount,
        toAsset: to,
      } })
    }
  }

  const onSwap = () => {
    setFromAmountError(false)
    setFromAssetError(false)
    setToAssetError(false)

    let error = false

    if(!fromAmountValue || fromAmountValue === '' || isNaN(fromAmountValue)) {
      setFromAmountError('From amount is required')
      error = true
    } else {
      if(!fromAssetValue.balance || isNaN(fromAssetValue.balance) || BigNumber(fromAssetValue.balance).lte(0))  {
        setFromAmountError('Invalid balance')
        error = true
      } else if(BigNumber(fromAmountValue).lt(0)) {
        setFromAmountError('Invalid amount')
        error = true
      } else if (fromAssetValue && BigNumber(fromAmountValue).gt(fromAssetValue.balance)) {
        setFromAmountError(`Greater than your available balance`)
        error = true
      }
    }

    if(!fromAssetValue || fromAssetValue === null) {
      setFromAssetError('From asset is required')
      error = true
    }

    if(!toAssetValue || toAssetValue === null) {
      setFromAssetError('To asset is required')
      error = true
    }

    if(!error) {
      setLoading(true)

      stores.dispatcher.dispatch({ type: FIXED_FOREX_SWAP, content: {
        fromAmount: fromAmountValue,
        fromAsset: fromAssetValue,
        toAmount: toAmountValue,
        toAsset: toAssetValue,
      } })
    }
  }

  const onApprove = () => {
    setFromAmountError(false)
    setFromAssetError(false)
    setToAssetError(false)

    let error = false

    if(!fromAmountValue || fromAmountValue === '' || isNaN(fromAmountValue)) {
      setFromAmountError('From amount is required')
      error = true
    } else {
      if(!fromAssetValue.balance || isNaN(fromAssetValue.balance) || BigNumber(fromAssetValue.balance).lte(0))  {
        setFromAmountError('Invalid balance')
        error = true
      } else if(BigNumber(fromAmountValue).lt(0)) {
        setFromAmountError('Invalid amount')
        error = true
      } else if (fromAssetValue && BigNumber(fromAmountValue).gt(fromAssetValue.balance)) {
        setFromAmountError(`Greater than your available balance`)
        error = true
      }
    }

    if(!fromAssetValue || fromAssetValue === null) {
      setFromAssetError('From asset is required')
      error = true
    }

    if(!toAssetValue || toAssetValue === null) {
      setFromAssetError('To asset is required')
      error = true
    }

    if(!error) {
      setApprovalLoading(true)

      stores.dispatcher.dispatch({ type: FIXED_FOREX_APPROVE_SWAP, content: {
        fromAmount: fromAmountValue,
        fromAsset: fromAssetValue,
        toAmount: toAmountValue,
        toAsset: toAssetValue,
      } })
    }
  }

  const setBalance100 = () => {
    setFromAmountValue(fromAssetValue.balance)
    calculateReceiveAmount(fromAssetValue.balance, toAssetValue)
  }

  const renderMassiveInput = (type, amountValue, amountError, amountChanged, assetValue, assetError, assetOptions, onAssetSelect) => {
    const isDark = theme?.palette?.type === 'dark'

    return (
      <div className={ classes.textField}>
        <div className={ classes.inputTitleContainer }>
          <div className={ classes.inputTitle }>
            <Typography variant='h5' noWrap className={ classes.inputTitleWithIcon }>{ type }</Typography>
          </div>
          <div className={ classes.inputBalance }>
            <Typography variant='h5' noWrap onClick={ () => {
              if(type === 'From') {
                setBalance100()
              }
            }}>
              { (assetValue && assetValue.balance) ?
                formatCurrency(assetValue.balance) + ' ' + assetValue.symbol :
                ''
              }
            </Typography>
          </div>
        </div>
        <div className={ `${classes.massiveInputContainer} ${ !isDark && classes.whiteBackground } ${ (amountError || assetError) && classes.error }` }>
          <div className={ classes.massiveInputAssetSelect }>
            <AssetSelect type={type} value={ assetValue } assetOptions={ assetOptions } onSelect={ onAssetSelect } />
          </div>
          <div className={ classes.massiveInputAmount }>
            <TextField
              placeholder='0.00'
              fullWidth
              error={ amountError }
              helperText={ amountError }
              value={ amountValue }
              onChange={ amountChanged }
              disabled={ loading || type === 'To' }
              InputProps={{
                className: classes.largeInput
              }}
            />
          </div>
        </div>
      </div>
    )
  }

  let approvalNotRequired = false
  if(fromAssetValue) {
    approvalNotRequired = BigNumber(fromAssetValue.allowance).gte(fromAmountValue) || ((!fromAmountValue || fromAmountValue === '') && BigNumber(fromAssetValue.allowance).gt(0) )
  }

  const formatApproved = (am) => {
    if(BigNumber(am).gte(1000000000000000)) {
      return 'Approved Forever'
    }

    return `Approved ${formatCurrency(am)}`
  }

  return (
    <div className={ classes.swapInputs }>
      { renderMassiveInput('From', fromAmountValue, fromAmountError, fromAmountChanged, fromAssetValue, fromAssetError, fromAssetOptions, onAssetSelect) }
      <div className={ classes.swapIconContainer }>
        <ArrowDownwardIcon className={ classes.swapIcon } />
      </div>
      { renderMassiveInput('To', toAmountValue, toAmountError, toAmountChanged, toAssetValue, toAssetError, toAssetOptions, onAssetSelect) }
      <div className={ classes.actionsContainer }>
        <Button
          className={ classes.actionButton }
          size='large'
          disableElevation
          variant='contained'
          color='primary'
          onClick={ onApprove }
          disabled={ approvalLoading || approvalNotRequired }
          >
          <Typography className={ classes.actionButtonText }>{ approvalNotRequired ? formatApproved( fromAssetValue?.allowance ) : ( approvalLoading ? `Approving` : `Approve`)}</Typography>
          { approvalLoading && <CircularProgress size={10} className={ classes.loadingCircle } /> }
        </Button>
        <Button
          className={ classes.actionButton }
          variant='contained'
          size='large'
          color='primary'
          className={classes.buttonOverride}
          disabled={ loading || !approvalNotRequired }
          onClick={ onSwap }
          >
          <Typography className={ classes.actionButtonText }>{ loading ? `Swapping` : `Swap` }</Typography>
          { loading && <CircularProgress size={10} className={ classes.loadingCircle } /> }
        </Button>
      </div>
    </div>
  )
}

function AssetSelect({ type, value, assetOptions, onSelect }) {

  const [ open, setOpen ] = useState(false);
  const [ search, setSearch ] = useState('')
  const [ withBalance, setWithBalance ] = useState(/*type === 'From' ? true : false*/ true)

  const openSearch = () => {
    setOpen(true)
    setSearch('')
  };

  const onSearchChanged = (event) => {
    setSearch(event.target.value)
  }

  const onLocalSelect = (type, asset) => {
    setOpen(false)
    onSelect(type, asset)
  }

  const onClose = () => {
    setOpen(false)
  }

  const renderAssetOption = (type, asset, idx) => {
    return (
      <MenuItem val={ asset.Name } key={ asset.Name+'_'+idx } className={ classes.assetSelectMenu } onClick={ () => { onLocalSelect(type, asset) } }>
        <div className={ classes.assetSelectMenuItem }>
          <div className={ classes.displayDualIconContainerSmall }>
            <img
              className={ classes.displayAssetIconSmall }
              alt=""
              src={ asset ? `https://raw.githubusercontent.com/yearn/yearn-assets/master/icons/multichain-tokens/1/${asset.address}/logo-128.png` : '' }
              height='60px'
              onError={(e)=>{e.target.onerror = null; e.target.src="/tokens/unknown-logo.png"}}
            />
          </div>
        </div>
        <div className={ classes.assetSelectIconName }>
          <Typography variant='h5'>{ asset ? asset.symbol : '' }</Typography>
          <Typography variant='subtitle1' color='textSecondary'>{ asset ? asset.name : '' }</Typography>
        </div>
        <div className={ classes.assetSelectBalance}>
          <Typography variant='h5'>{ (asset && asset.balance) ? formatCurrency(asset.balance) : '0.00' }</Typography>
          <Typography variant='subtitle1' color='textSecondary'>{ 'Balance' }</Typography>
        </div>
      </MenuItem>
    )
  }

  return (
    <React.Fragment>
      <div className={ classes.displaySelectContainer } onClick={ () => { openSearch() } }>
        <div className={ classes.assetSelectMenuItem }>
          <div className={ classes.displayDualIconContainer }>
            <img
              className={ classes.displayAssetIcon }
              alt=""
              src={ value ? `https://raw.githubusercontent.com/yearn/yearn-assets/master/icons/multichain-tokens/1/${value.address}/logo-128.png` : '' }
              height='100px'
              onError={(e)=>{e.target.onerror = null; e.target.src="/tokens/unknown-logo.png"}}
            />
          </div>
        </div>
      </div>
      <Dialog onClose={ onClose } aria-labelledby="simple-dialog-title" open={ open } >
        <div className={ classes.searchContainer }>
          <div className={ classes.searchInline }>
            <TextField
              autoFocus
              variant="outlined"
              fullWidth
              placeholder="ETH, CRV, ..."
              value={ search }
              onChange={ onSearchChanged }
              InputProps={{
                startAdornment: <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>,
              }}
            />
          </div>
          <div className={ classes.assetSearchResults }>
            {
              assetOptions ? assetOptions.filter((asset) => {
                if(search && search !== '') {
                  return asset.symbol.toLowerCase().includes(search.toLowerCase()) ||
                    asset.name.toLowerCase().includes(search.toLowerCase())
                } else {
                  return true
                }
              }).map((asset, idx) => {
                return renderAssetOption(type, asset, idx)
              }) : []
            }
          </div>
        </div>
      </Dialog>
    </React.Fragment>
  )
}

export default withTheme(Setup)
