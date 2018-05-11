import React, { PureComponent } from "react";
import { PropTypes } from "prop-types";
// import ImmutablePropTypes from 'react-immutable-proptypes';

import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import balances from "../store/selectors/balances";
import balancesReducer from "../store/reducers/balances";
import platform from "../store/selectors/platform";
import OasisButton from "../components/OasisButton";
import { InfoBox } from "../components/InfoBox";
import { InfoBoxBody } from "../components/InfoBoxBody";
import OasisAccordion from "../components/OasisAccordion";
import OasisTransactionStatusWrapper from "./OasisTransactionStatus";
import {
  TX_ALLOWANCE_TRUST_TOGGLE,
  TX_STATUS_AWAITING_CONFIRMATION,
  TX_STATUS_AWAITING_USER_ACCEPTANCE,
  TX_STATUS_CONFIRMED,
  TX_STATUS_REJECTED
} from "../store/reducers/transactions";
import network from "../store/selectors/network";
import FlexBox from "../components/FlexBox";
import {
  TOKEN_ALLOWANCE_TRUST_STATUS_DISABLED,
  TOKEN_ALLOWANCE_TRUST_STATUS_ENABLED, TOKEN_ALLOWANCE_TRUST_STATUS_ENABLED_MIN,
  TOKEN_ALLOWANCE_TRUST_STATUS_LOADING,
} from '../constants';

import OasisIcon from "../components/OasisIcon";
import OasisYourTransactionFailed from "../components/OasisYourTransactionFailed";

const propTypes = PropTypes && {
  actions: PropTypes.object.isRequired,
  subjectTrustStatus: PropTypes.bool,
  tokenName: PropTypes.string.isRequired,
  allowanceSubjectAddress: PropTypes.string.isRequired,
  isToggleEnabled: PropTypes.bool,
  onTransactionPending: PropTypes.func,
  onTransactionCompleted: PropTypes.func,
  onTransactionRejected: PropTypes.func,
  onCancelCleanup: PropTypes.func
};

export class SetTokenAllowanceTrustWrapper extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      isToggleAllowanceTxPending: false
    };

    this.toggleTokenAllowanceTrustStatus = this.toggleTokenAllowanceTrustStatus.bind(
      this
    );
    this.getAllowanceStatus();
  }

  async getAllowanceStatus() {
    const {
      actions: { getDefaultAccountTokenAllowanceForAddress },
      tokenName,
      allowanceSubjectAddress
    } = this.props;
    if (
      this.props.contractsLoaded
    ) {
      return getDefaultAccountTokenAllowanceForAddress(
        tokenName,
        allowanceSubjectAddress
      );
    }
  }

  onTransactionAwaitingSign() {
    this.setState({ txStatus: TX_STATUS_AWAITING_USER_ACCEPTANCE });
  }

  setTokenAllowanceTrustStatus(newAllowanceTrustStatus) {
    const {
      tokenName,
      allowanceSubjectAddress,
      actions: { setTokenAllowanceTrustStatus }
    } = this.props;

    this.setState({ disableActionDispatchButton: true });

    return setTokenAllowanceTrustStatus(
      {
        tokenName,
        newAllowanceTrustStatus,
        allowanceSubjectAddress
      },
      {
        onStart: this.onTransactionAwaitingSign.bind(this),
        onPending: this.onTransactionPending.bind(this),
        onCompleted: this.onTransactionCompleted.bind(this),
        onFailed: this.onTransactionRejected.bind(this),
        onCancelCleanup: this.onUserCancel.bind(this)
      }
    );
  }

  onTransactionPending({ txStartTimestamp }) {
    console.log("txStartTimestamp", txStartTimestamp);
    this.setState({
      txTimestamp: txStartTimestamp,
      txStatus: TX_STATUS_AWAITING_CONFIRMATION
    });
    this.props.onTransactionPending();
  }

  async onTransactionCompleted() {
    this.setState({ disableActionDispatchButton: false });
    this.setState({
      txStatus: TX_STATUS_CONFIRMED
    });
    const newAllowanceStatus = (await this.getAllowanceStatus()).value.gt(TOKEN_ALLOWANCE_TRUST_STATUS_ENABLED_MIN);
    this.props.onTransactionCompleted(newAllowanceStatus);
  }

  onTransactionRejected() {
    this.setState({ disableActionDispatchButton: false });
    this.props.onTransactionRejected();
    this.setState({
      txStatus: TX_STATUS_REJECTED
    });
  }

  onUserCancel() {
    this.setState({ disableActionDispatchButton: false, txStatus: undefined });
    this.props.onCancelCleanup();
  }

  toggleTokenAllowanceTrustStatus() {
    const { subjectTrustStatus } = this.props;
    if (subjectTrustStatus === TOKEN_ALLOWANCE_TRUST_STATUS_ENABLED) {
      this.setTokenAllowanceTrustStatus(TOKEN_ALLOWANCE_TRUST_STATUS_DISABLED);
    } else if (subjectTrustStatus === TOKEN_ALLOWANCE_TRUST_STATUS_DISABLED) {
      this.setTokenAllowanceTrustStatus(TOKEN_ALLOWANCE_TRUST_STATUS_ENABLED);
    }
  }

  getLabel() {
    if (this.isAllowanceLoading()) {
      return "Loading";
    } else if (this.props.isToggleEnabled) {
      return this.isAllowanceEnabled() ? "Disable" : "Enable";
    } else {
      return "Enable";
    }
  }

  renderTransactionInfo() {
    const { txTimestamp, txStatus } = this.state;
    return txStatus && txStatus !== TX_STATUS_REJECTED ? (
      <OasisTransactionStatusWrapper
        inline
        noBorder
        txTimestamp={txTimestamp}
        localStatus={txStatus}
        txType={TX_ALLOWANCE_TRUST_TOGGLE}
      />
    ) : null;
  }

  isAllowanceEnabled() {
    return (
      this.props.subjectTrustStatus === TOKEN_ALLOWANCE_TRUST_STATUS_ENABLED
    );
  }

  isAllowanceLoading() {
    return (
      this.props.subjectTrustStatus === TOKEN_ALLOWANCE_TRUST_STATUS_LOADING ||
      this.props.subjectTrustStatus === undefined
    );
  }

  shouldDisplay() {
    return this.isAllowanceLoading()
      ? false
      : this.props.isToggleEnabled ? true : !this.isAllowanceEnabled();
  }

  mainInfoBoxContent() {
    return (
      <OasisAccordion isOpen={true} heading={this.renderAccordionHeading()}>
        {this.renderAccordionContent()}
      </OasisAccordion>
    );
  }

  shouldDisableActionDispatch() {
    const { disableActionDispatchButton } = this.state;
    const { isToggleEnabled } = this.props;
    return disableActionDispatchButton
      ? disableActionDispatchButton
      : isToggleEnabled ? false : this.isAllowanceEnabled();
  }

  renderAccordionHeading() {
    const { txStatus } = this.state;
    const isAllowanceEnabled = this.isAllowanceEnabled();
    const prefix = !this.props.isToggleEnabled
      ? "Enable"
      : isAllowanceEnabled ? "Disable" : "Enable";
    return (
      <FlexBox alignContent="space-between">
        <div>
          {prefix} <b>{this.props.tokenName}</b> for trading
          {this.renderTransactionInfo()}
        </div>
        <div hidden={txStatus}>
          <OasisButton
            onClick={this.toggleTokenAllowanceTrustStatus}
            size="md"
            color={
              isAllowanceEnabled || this.shouldDisableActionDispatch()
                ? "default"
                : "success"
            }
          >
            {this.getLabel()}
          </OasisButton>
        </div>
      </FlexBox>
    );
  }

  yourTransactionFailed() {
    const { txStatus } = this.state;
    return txStatus === TX_STATUS_REJECTED ? (
      <OasisYourTransactionFailed />
    ) : null;
  }

  renderAccordionContent() {
    return !this.state.txStatus ? (
      <div style={{ display: "flex" }} hidden={this.isAllowanceEnabled()}>
        <div>
          <OasisIcon icon="idle" />
        </div>
        <div>
          You need first grant access to withdraw from your personal account. To
          disable {this.props.tokenName} trading use Allowance widget on the
          funds page.
        </div>
      </div>
    ) : null;
  }

  render() {
    return (
      <div hidden={!this.shouldDisplay()}>
        <InfoBox justifyContent="space-between" fullWidth>
          <InfoBoxBody>{this.mainInfoBoxContent()}</InfoBoxBody>
        </InfoBox>
        {this.yourTransactionFailed()}
      </div>
    );
  }
}

export function mapStateToProps(state, { allowanceSubjectAddress, tokenName }) {
  return {
    subjectTrustStatus: balances.tokenAllowanceTrustStatus(state, {
      allowanceSubjectAddress,
      tokenName
    }),
    contractsLoaded: platform.contractsLoaded(state),
    latestBlockNumber: network.latestBlockNumber(state)
  };
}

export function mapDispatchToProps(dispatch) {
  const actions = {
    setTokenAllowanceTrustStatus:
      balancesReducer.actions.setTokenAllowanceTrustEpic,
    getDefaultAccountTokenAllowanceForAddress:
      balancesReducer.actions.getDefaultAccountTokenAllowanceForAddress
  };
  return { actions: bindActionCreators(actions, dispatch) };
}

SetTokenAllowanceTrustWrapper.propTypes = propTypes;
SetTokenAllowanceTrustWrapper.displayName = "SetTokenAllowanceTrust";
export default connect(mapStateToProps, mapDispatchToProps)(
  SetTokenAllowanceTrustWrapper
);
