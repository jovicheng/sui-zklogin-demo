import { LoadingButton } from "@mui/lab";
import {
  Alert,
  Box,
  Button,
  ButtonGroup,
  Stack,
  Step,
  StepLabel,
  Stepper,
  Typography,
} from "@mui/material";
import { fromB64 } from "@mysten/bcs";
import { useSuiClientQuery } from "@mysten/dapp-kit";
import { SuiClient } from "@mysten/sui.js/client";
import { SerializedSignature } from "@mysten/sui.js/cryptography";
import { Ed25519Keypair } from "@mysten/sui.js/keypairs/ed25519";
import { TransactionBlock } from "@mysten/sui.js/transactions";
import { MIST_PER_SUI } from "@mysten/sui.js/utils";
import {
  genAddressSeed,
  generateNonce,
  generateRandomness,
  getExtendedEphemeralPublicKey,
  getZkLoginSignature,
  jwtToAddress,
} from "@mysten/zklogin";
import axios from "axios";
import { BigNumber } from "bignumber.js";
import { JwtPayload, jwtDecode } from "jwt-decode";
import { enqueueSnackbar } from "notistack";
import queryString from "query-string";
import { useEffect, useMemo, useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import { useLocation } from "react-router-dom";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import "./App.css";
import GoogleLogo from "./assets/google.svg";
import {
  AXIOS_ZKPROOF,
  BUILD_ZKLOGIN_SIGNATURE,
  GENERATE_NONCE,
} from "./code_example";
import {
  CLIENT_ID,
  FULLNODE_URL,
  KEY_PAIR_SESSION_STORAGE_KEY,
  MAX_EPOCH_LOCAL_STORAGE_KEY,
  RANDOMNESS_SESSION_STORAGE_KEY,
  REDIRECT_URI,
  STEPS_LABELS_TRANS_KEY,
  SUI_PROVER_DEV_ENDPOINT,
  USER_SALT_LOCAL_STORAGE_KEY,
} from "./constant";
import { base, gray } from "./theme/colors";

export type PartialZkLoginSignature = Omit<
  Parameters<typeof getZkLoginSignature>["0"]["inputs"],
  "addressSeed"
>;

const suiClient = new SuiClient({ url: FULLNODE_URL });

function App() {
  const { t, i18n } = useTranslation();

  const [currentEpoch, setCurrentEpoch] = useState("");
  const [nonce, setNonce] = useState("");
  const [oauthParams, setOauthParams] =
    useState<queryString.ParsedQuery<string>>();
  const location = useLocation();
  const [zkLoginUserAddress, setZkLoginUserAddress] = useState("");
  const [decodedJwt, setDecodedJwt] = useState<JwtPayload>();
  const [jwtString, setJwtString] = useState("");
  const [ephemeralKeyPair, setEphemeralKeyPair] = useState<Ed25519Keypair>();
  const [userSalt, setUserSalt] = useState<string>();
  const [zkProof, setZkProof] = useState<PartialZkLoginSignature>();
  const [extendedEphemeralPublicKey, setExtendedEphemeralPublicKey] =
    useState("");
  const [maxEpoch, setMaxEpoch] = useState(0);
  const [randomness, setRandomness] = useState("");
  const [activeStep, setActiveStep] = useState(0);
  const [fetchingZKProof, setFetchingZKProof] = useState(false);
  const [executingTxn, setExecutingTxn] = useState(false);
  const [executeDigest, setExecuteDigest] = useState("");
  const [lang, setLang] = useState<"zh" | "en">("en");

  // Change lng
  useEffect(() => {
    i18n.changeLanguage(lang);
  }, [i18n, lang]);

  useEffect(() => {
    const res = queryString.parse(location.hash);
    setOauthParams(res);
  }, [location]);

  // query jwt id_token
  useEffect(() => {
    if (oauthParams && oauthParams.id_token) {
      const decodedJwt = jwtDecode(oauthParams.id_token as string);
      setJwtString(oauthParams.id_token as string);
      setDecodedJwt(decodedJwt);
      setActiveStep(2);
    }
  }, [oauthParams]);

  useEffect(() => {
    const privateKey = window.sessionStorage.getItem(
      KEY_PAIR_SESSION_STORAGE_KEY
    );
    if (privateKey) {
      const ephemeralKeyPair = Ed25519Keypair.fromSecretKey(
        fromB64(privateKey)
      );
      setEphemeralKeyPair(ephemeralKeyPair);
    }
    const randomness = window.sessionStorage.getItem(
      RANDOMNESS_SESSION_STORAGE_KEY
    );
    if (randomness) {
      setRandomness(randomness);
    }
    const userSalt = window.localStorage.getItem(USER_SALT_LOCAL_STORAGE_KEY);
    if (userSalt) {
      setUserSalt(userSalt);
    }

    const maxEpoch = window.localStorage.getItem(MAX_EPOCH_LOCAL_STORAGE_KEY);

    if (maxEpoch) {
      setMaxEpoch(Number(maxEpoch));
    }
  }, []);

  const nextButtonDisabled = useMemo(() => {
    switch (activeStep) {
      case 0:
        return !ephemeralKeyPair;
      case 2:
        return !jwtString;
      case 3:
        return !userSalt;
      case 4:
        return !zkLoginUserAddress;
      case 5:
        return !zkProof;
      case 6:
        return true;
      default:
        break;
    }
  }, [
    activeStep,
    jwtString,
    ephemeralKeyPair,
    zkLoginUserAddress,
    zkProof,
    userSalt,
  ]);

  // query zkLogin address balance
  const { data: addressBalance } = useSuiClientQuery(
    "getBalance",
    {
      owner: zkLoginUserAddress,
    },
    {
      enabled: Boolean(zkLoginUserAddress),
      refetchInterval: 1500,
    }
  );

  return (
    <Box>
      <Box
        sx={{
          mb: "36px",
        }}
      >
        <Typography
          sx={{
            fontSize: "2rem",
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            columnGap: "16px",
          }}
        >
          Sui zkLogin Demo{" "}
          <ButtonGroup
            variant="outlined"
            aria-label="Disabled elevation buttons"
          >
            <Button
              size="small"
              variant={lang === "en" ? "contained" : "outlined"}
              onClick={() => {
                setLang("en");
              }}
            >
              ENG
            </Button>
            <Button
              size="small"
              variant={lang === "zh" ? "contained" : "outlined"}
              onClick={() => {
                setLang("zh");
              }}
            >
              中文
            </Button>
          </ButtonGroup>
          <Typography
            sx={{
              color: base.white,
              background: gray[900],
              p: "4px 8px",
              fontWeight: 400,
              fontSize: "0.75rem",
              borderRadius: "4px",
            }}
          >
            Devnet
          </Typography>
        </Typography>
        <Typography>
          <a href="https://github.com/jovicheng" target="_blank">
            @ Jovi
          </a>
        </Typography>
      </Box>
      {/* <Alert
        severity="error"
        sx={{
          mb: "36px",
          fontWeight: 600,
        }}
      >
        Sui Devnet node is currently unavailable, and the demo process may not
        be completed.
      </Alert> */}
      <Box
        sx={{
          width: "100%",
          overflowX: "hidden",
        }}
      >
        <Stepper activeStep={activeStep}>
          {STEPS_LABELS_TRANS_KEY.map((stepLabel, index) => (
            <Step key={index}>
              <StepLabel>{t(stepLabel)}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </Box>

      <Box sx={{ mt: "24px" }}>
        <Button
          variant="outlined"
          disabled={activeStep === 0}
          onClick={() => {
            setActiveStep(activeStep - 1);
          }}
        >
          Back
        </Button>
        {activeStep !== 6 && (
          <Button
            sx={{
              ml: "12px",
            }}
            variant="outlined"
            disabled={nextButtonDisabled}
            onClick={() => {
              setActiveStep(activeStep + 1);
            }}
          >
            Next
          </Button>
        )}
      </Box>

      {zkLoginUserAddress && (
        <Stack direction="row" spacing={1} sx={{ mt: "24px" }}>
          <Typography>
            <code>
              <Typography
                component="span"
                sx={{
                  fontFamily: "'Noto Sans Mono', monospace;",
                  fontWeight: 600,
                }}
              >
                {zkLoginUserAddress}
              </Typography>
            </code>
          </Typography>
          {addressBalance && (
            <Typography>
              Balance:{" "}
              {BigNumber(addressBalance?.totalBalance)
                .div(MIST_PER_SUI.toString())
                .toFixed(6)}{" "}
              SUI
            </Typography>
          )}
        </Stack>
      )}

      <Box
        sx={{
          mt: "24px",
          p: "12px",
        }}
        className="border border-slate-300 rounded-xl"
      >
        {/* Step 1 */}
        {activeStep === 0 && (
          <Stack spacing={2}>
            <Typography
              sx={{
                fontSize: "1.25rem",
                fontWeight: 600,
                mb: "12px !important",
              }}
            >
              {t("431375b3")}
            </Typography>
            <Typography>
              <Trans i18nKey={"62a0a307"}>
                The ephemeral key pair is used to sign the
                <code>transactionBlock</code>
              </Trans>
            </Typography>
            <Typography>{t("9ec629a8")} (Session Storage)</Typography>
            <Stack direction="row" spacing={2}>
              <Button
                variant="contained"
                disabled={Boolean(ephemeralKeyPair)}
                onClick={() => {
                  const ephemeralKeyPair = Ed25519Keypair.generate();
                  window.sessionStorage.setItem(
                    KEY_PAIR_SESSION_STORAGE_KEY,
                    ephemeralKeyPair.export().privateKey
                  );
                  setEphemeralKeyPair(ephemeralKeyPair);
                }}
              >
                Create random ephemeral KeyPair{" "}
              </Button>
              <Button
                variant="contained"
                color="error"
                disabled={!ephemeralKeyPair}
                onClick={() => {
                  window.sessionStorage.removeItem(
                    KEY_PAIR_SESSION_STORAGE_KEY
                  );
                  setEphemeralKeyPair(undefined);
                }}
              >
                Clear ephemeral KeyPair{" "}
              </Button>
            </Stack>
            <Typography>
              <SyntaxHighlighter wrapLongLines language="json" style={oneDark}>
                {`// PrivateKey
${JSON.stringify(ephemeralKeyPair?.export())}`}
              </SyntaxHighlighter>
              <SyntaxHighlighter wrapLongLines language="json" style={oneDark}>
                {`// PublicKey:
${JSON.stringify(ephemeralKeyPair?.getPublicKey().toBase64())}`}
              </SyntaxHighlighter>
            </Typography>
          </Stack>
        )}
        {/* Step 2 */}
        {activeStep === 1 && (
          <Stack spacing={2}>
            <Typography
              sx={{
                fontSize: "1.25rem",
                fontWeight: 600,
                mb: "12px !important",
              }}
            >
              {t("4f04f1f8")} (from OpenID Provider)
            </Typography>
            <Typography>{t("56adebff")}</Typography>
            <Stack spacing={1}>
              <Typography>
                1. {"  "}
                <code>$CLIENT_ID</code> {t("e062b220")}
              </Typography>
              <Typography>
                2. <code>$REDIRECT_URL</code>
                {t("ab92f814")}
              </Typography>
              <Typography>
                3. <code>$NONCE</code>
                {"  "}
                <Trans i18nKey={"2397bcd8"}>
                  （Generated through<code>ephemeralKeyPair</code>
                  <code>maxEpoch</code>
                  <code>randomness</code>）
                </Trans>
              </Typography>
              <Stack
                spacing={1}
                sx={{
                  m: "12px 0px !important",
                }}
              >
                <Typography>
                  <code>*ephemeralKeyPair</code>: {t("4274e146")}
                </Typography>
                <Typography>
                  <code>*maxEpoch</code>: {t("bf54d75b")}
                </Typography>
                <Typography>
                  <code>*randomness</code>: {t("4a7add7c")}
                </Typography>
              </Stack>
            </Stack>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
              }}
            >
              <Button
                variant="contained"
                size="small"
                onClick={async () => {
                  const { epoch } = await suiClient.getLatestSuiSystemState();

                  setCurrentEpoch(epoch);
                  window.localStorage.setItem(
                    MAX_EPOCH_LOCAL_STORAGE_KEY,
                    String(Number(epoch) + 10)
                  );
                  setMaxEpoch(Number(epoch) + 10);
                }}
              >
                {t("3a96f638")}
              </Button>
              {currentEpoch && (
                <Box sx={{ ml: "12px" }}>
                  {t("6d47d563")} <code>{currentEpoch}</code>
                </Box>
              )}
              <Typography sx={{ ml: "24px" }}>
                {t("6a747813")}
                <code>maxEpoch:{maxEpoch}</code>
              </Typography>
            </Box>
            <Box
              sx={{
                mt: "16px",
              }}
            >
              <SyntaxHighlighter
                wrapLongLines
                language="typescript"
                style={oneDark}
              >
                {`// randomness
const randomness = generateRandomness();`}
              </SyntaxHighlighter>
            </Box>
            <Stack direction="row" spacing={1} alignItems="center">
              <Button
                variant="contained"
                size="small"
                onClick={() => {
                  const randomness = generateRandomness();
                  window.sessionStorage.setItem(
                    RANDOMNESS_SESSION_STORAGE_KEY,
                    randomness
                  );
                  setRandomness(randomness);
                }}
              >
                {t("2e2913c8")}
              </Button>
              <Typography>
                <code>randomness: {randomness}</code>
              </Typography>
            </Stack>
            <Box>
              <SyntaxHighlighter
                wrapLongLines
                language="typescript"
                style={oneDark}
              >
                {GENERATE_NONCE}
              </SyntaxHighlighter>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Button
                  variant="contained"
                  disabled={
                    !ephemeralKeyPair || maxEpoch === undefined || !randomness
                  }
                  onClick={() => {
                    if (!ephemeralKeyPair) {
                      return;
                    }
                    const nonce = generateNonce(
                      ephemeralKeyPair.getPublicKey(),
                      maxEpoch,
                      randomness
                    );
                    setNonce(nonce);
                  }}
                >
                  Generate Nonce
                </Button>
                {nonce && (
                  <Typography>
                    nonce: <code>{nonce}</code>
                  </Typography>
                )}
              </Stack>
              <Button
                sx={{
                  mt: "24px",
                }}
                disabled={!nonce}
                variant="contained"
                onClick={() => {
                  const params = new URLSearchParams({
                    client_id: CLIENT_ID,
                    redirect_uri: REDIRECT_URI,
                    response_type: "id_token",
                    scope: "openid",
                    nonce: nonce,
                  });
                  const loginURL = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
                  window.location.replace(loginURL);
                }}
              >
                <img
                  src={GoogleLogo}
                  width="16px"
                  style={{
                    marginRight: "8px",
                  }}
                  alt="Google"
                />{" "}
                Sign In With Google
              </Button>
            </Box>
          </Stack>
        )}
        {/* Step 3 */}
        {activeStep === 2 && (
          <Box>
            <Typography
              sx={{
                fontSize: "1.25rem",
                fontWeight: 600,
                mb: "12px !important",
              }}
            >
              {t("ef410d70")}
            </Typography>
            {decodedJwt && (
              <Alert variant="standard" color="success">
                Successfully logged in via Google!
              </Alert>
            )}
            <Box sx={{ m: "16px 0" }}>
              UrlQuery: <code>id_token</code>
            </Box>
            <SyntaxHighlighter
              wrapLongLines
              wrapLines
              language="typescript"
              style={oneDark}
            >
              {`// id_token Header.Payload.Signature
${JSON.stringify(jwtString)}

const jwtPayload = jwtDecode(id_token);
const decodedJwt = jwt_decode(jwtPayload) as JwtPayload;`}
            </SyntaxHighlighter>
            <SyntaxHighlighter wrapLongLines language="json" style={oneDark}>
              {`// JWT Payload
${JSON.stringify(decodedJwt, null, 2)}`}
            </SyntaxHighlighter>
            <Stack
              spacing={1}
              sx={{
                m: "24px 0",
              }}
            >
              <Typography>
                <code>iss (issuer)</code>：<b>{t("c20d7af6")}</b>
              </Typography>
              <Typography>
                <code>aud (audience)</code>：<b>{t("e9286432")}</b>
              </Typography>
              <Typography>
                <code>sub (subject)</code>：<b>{t("0ac23a36")}</b>
              </Typography>
              <Typography>
                <code>nonce</code>：{t("20547967")}
              </Typography>
              <Typography>
                <code>nbf (Not Before)</code>：{t("060c9525")}
              </Typography>
              <Typography>
                <code>iat(Issued At)</code>：{t("5bbacff6")}
              </Typography>
              <Typography>
                <code>exp (expiration time)</code>：{t("3caf36d5")}
              </Typography>
              <Typography>
                <code>jti (JWT ID)</code>：{t("64ab7f15")}
              </Typography>
            </Stack>
          </Box>
        )}
        {/* Step 4 */}
        {activeStep === 3 && (
          <Stack spacing={2}>
            <Typography
              sx={{
                fontSize: "1.25rem",
                fontWeight: 600,
                mb: "12px !important",
              }}
            >
              {t("b7c54098")}
            </Typography>
            <Typography>{t("ec71ef53")}</Typography>
            <Alert severity="warning">{t("cb63dedd")}</Alert>
            <Trans i18nKey={"c4a666f0"}>
              <Typography>保存在哪：</Typography>
              <Typography>1.要求用户记住(发送到用户邮箱)</Typography>
              <Typography>2.储存在客户端(浏览器)</Typography>
              <Typography>3.保存在APP Backend数据库，与UID一一对应</Typography>
            </Trans>
            <Stack
              direction="row"
              alignItems="center"
              spacing={2}
              sx={{
                mt: "12px!important",
              }}
            >
              <Button
                variant="contained"
                disabled={Boolean(userSalt)}
                onClick={() => {
                  const salt = generateRandomness();
                  window.localStorage.setItem(
                    USER_SALT_LOCAL_STORAGE_KEY,
                    salt
                  );
                  setUserSalt(salt);
                }}
              >
                Generate User Salt
              </Button>
              <Button
                variant="contained"
                disabled={!userSalt}
                color="error"
                onClick={() => {
                  const salt = generateRandomness();
                  setUserSalt(salt);
                  window.localStorage.removeItem(USER_SALT_LOCAL_STORAGE_KEY);
                  setUserSalt(undefined);
                }}
              >
                Delete User Salt
              </Button>
            </Stack>
            <Typography>
              User Salt: {userSalt && <code>{userSalt}</code>}
            </Typography>
          </Stack>
        )}
        {/* Step 5 */}
        {activeStep === 4 && (
          <Stack spacing={2}>
            <Typography
              sx={{
                fontSize: "1.25rem",
                fontWeight: 600,
                mb: "12px !important",
              }}
            >
              {t("2fb333f5")}
            </Typography>
            <Typography>
              <Trans i18nKey="e05797f4">
                用户 Sui 地址由 <code>sub</code> 、 <code>iss</code> 、
                <code>aud</code> 和 <code>user_salt</code> 共同决定，对于同一个
                JWT，每次登陆时 <code>sub</code> 、 <code>iss</code> 、
                <code>aud</code> 都不会变。
              </Trans>
            </Typography>
            <SyntaxHighlighter
              wrapLongLines
              language="typescript"
              style={oneDark}
            >
              {`const zkLoginUserAddress = jwtToAddress(jwt, userSalt);`}
            </SyntaxHighlighter>
            <Box>
              <Button
                variant="contained"
                disabled={!userSalt || !jwtString}
                onClick={() => {
                  if (!userSalt) {
                    return;
                  }
                  const zkLoginUserAddress = jwtToAddress(jwtString, userSalt);
                  setZkLoginUserAddress(zkLoginUserAddress);
                }}
              >
                {t("c9bbf457")}
              </Button>
            </Box>
            <Typography>
              User Sui Address:
              {zkLoginUserAddress && (
                <code>
                  <Typography
                    component="span"
                    sx={{
                      fontFamily: "'Noto Sans Mono', monospace;",
                      fontWeight: 600,
                    }}
                  >
                    {zkLoginUserAddress}
                  </Typography>
                </code>
              )}
            </Typography>
          </Stack>
        )}
        {/* Step 6 */}
        {activeStep === 5 && (
          <Stack spacing={2}>
            <Typography
              sx={{
                fontSize: "1.25rem",
                fontWeight: 600,
                mb: "12px !important",
              }}
            >
              {t("51e8ceeb")}
            </Typography>
            <Typography>{t("446760ac")}</Typography>
            <Typography>{t("c5c9e603")}</Typography>
            <SyntaxHighlighter
              wrapLongLines
              language="typescript"
              style={oneDark}
            >
              {`const extendedEphemeralPublicKey = getExtendedEphemeralPublicKey(
  ephemeralKeyPair.getPublicKey()
);`}
            </SyntaxHighlighter>
            <Box>
              <Button
                variant="contained"
                onClick={() => {
                  if (!ephemeralKeyPair) {
                    return;
                  }
                  const extendedEphemeralPublicKey =
                    getExtendedEphemeralPublicKey(
                      ephemeralKeyPair.getPublicKey()
                    );

                  setExtendedEphemeralPublicKey(extendedEphemeralPublicKey);
                }}
              >
                {t("71c429d2")}
              </Button>
              <Typography
                sx={{
                  mt: "12px",
                }}
              >
                extendedEphemeralPublicKey:
                {extendedEphemeralPublicKey && (
                  <code>{extendedEphemeralPublicKey}</code>
                )}
              </Typography>
            </Box>
            <Typography>{t(`16ebd660`)}</Typography>
            <SyntaxHighlighter
              wrapLongLines
              language="typescript"
              style={oneDark}
            >
              {AXIOS_ZKPROOF}
            </SyntaxHighlighter>
            <LoadingButton
              loading={fetchingZKProof}
              variant="contained"
              disabled={
                !oauthParams?.id_token ||
                !extendedEphemeralPublicKey ||
                !maxEpoch ||
                !randomness ||
                !userSalt
              }
              onClick={async () => {
                try {
                  setFetchingZKProof(true);
                  const zkProofResult = await axios.post(
                    SUI_PROVER_DEV_ENDPOINT,
                    {
                      jwt: oauthParams?.id_token as string,
                      extendedEphemeralPublicKey: extendedEphemeralPublicKey,
                      maxEpoch: maxEpoch,
                      jwtRandomness: randomness,
                      salt: userSalt,
                      keyClaimName: "sub",
                    },
                    {
                      headers: {
                        "Content-Type": "application/json",
                      },
                    }
                  );
                  setZkProof(zkProofResult.data as PartialZkLoginSignature);
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                } catch (error: any) {
                  console.error(error);
                  enqueueSnackbar(
                    String(error?.response?.data?.message || error),
                    {
                      variant: "error",
                    }
                  );
                } finally {
                  setFetchingZKProof(false);
                }
              }}
            >
              {t("33893c96")}
            </LoadingButton>
            {zkProof && (
              <SyntaxHighlighter
                wrapLongLines
                language="typescript"
                style={oneDark}
              >
                {JSON.stringify(zkProof, null, 2)}
              </SyntaxHighlighter>
            )}
          </Stack>
        )}
        {/* Step 7 */}
        {activeStep === 6 && (
          <Box>
            <Typography
              sx={{
                fontSize: "1.25rem",
                fontWeight: 600,
                mb: "12px !important",
              }}
            >
              {t("acf1b947")}
            </Typography>
            <Alert severity="warning">{t("d58c9e1e")}</Alert>
            <Typography sx={{ mt: "12px" }}>
              {t("6591b962")}（<code>maxEpoch</code>）
            </Typography>
            <SyntaxHighlighter
              wrapLongLines
              language="typescript"
              style={oneDark}
            >
              {BUILD_ZKLOGIN_SIGNATURE}
            </SyntaxHighlighter>
            <div className="card">
              <LoadingButton
                loading={executingTxn}
                variant="contained"
                disabled={!decodedJwt}
                onClick={async () => {
                  try {
                    if (
                      !ephemeralKeyPair ||
                      !zkProof ||
                      !decodedJwt ||
                      !userSalt
                    ) {
                      return;
                    }
                    setExecutingTxn(true);
                    const txb = new TransactionBlock();

                    const [coin] = txb.splitCoins(txb.gas, [MIST_PER_SUI * 1n]);
                    txb.transferObjects(
                      [coin],
                      "0xfa0f8542f256e669694624aa3ee7bfbde5af54641646a3a05924cf9e329a8a36"
                    );
                    txb.setSender(zkLoginUserAddress);

                    const { bytes, signature: userSignature } = await txb.sign({
                      client: suiClient,
                      signer: ephemeralKeyPair, // This must be the same ephemeral key pair used in the ZKP request
                    });
                    if (!decodedJwt?.sub || !decodedJwt.aud) {
                      return;
                    }

                    const addressSeed: string = genAddressSeed(
                      BigInt(userSalt),
                      "sub",
                      decodedJwt.sub,
                      decodedJwt.aud as string
                    ).toString();

                    const zkLoginSignature: SerializedSignature =
                      getZkLoginSignature({
                        inputs: {
                          ...zkProof,
                          addressSeed,
                        },
                        maxEpoch,
                        userSignature,
                      });

                    const executeRes = await suiClient.executeTransactionBlock({
                      transactionBlock: bytes,
                      signature: zkLoginSignature,
                    });

                    enqueueSnackbar(
                      `Execution successful: ${executeRes.digest}`,
                      {
                        variant: "success",
                      }
                    );
                    setExecuteDigest(executeRes.digest);
                  } catch (error) {
                    console.error(error);
                    enqueueSnackbar(String(error), {
                      variant: "error",
                    });
                  } finally {
                    setExecutingTxn(false);
                  }
                }}
              >
                Execute Transaction Block
              </LoadingButton>
              {executeDigest && (
                <Alert severity="success" sx={{ mt: "12px" }}>
                  Execution successful:{" "}
                  <Typography
                    component="span"
                    sx={{
                      fontFamily: "'Noto Sans Mono', monospace;",
                      fontWeight: 600,
                    }}
                  >
                    <a
                      href={`https://suiexplorer.com/txblock/${executeDigest}?network=devnet`}
                      target="_blank"
                    >
                      {executeDigest}
                    </a>
                  </Typography>
                </Alert>
              )}
            </div>
          </Box>
        )}
      </Box>
    </Box>
  );
}

export default App;
