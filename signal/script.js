function checkAuthentication() {
    const isAuthenticated = localStorage.getItem("isAuthenticated");

    if (!isAuthenticated) {
        localStorage.setItem("intendedPage", window.location.pathname);
        window.location.href = "../login/index.html";
    }
}

window.onload = checkAuthentication;

function logout() {
    localStorage.removeItem("isAuthenticated");
    window.location.href = "../login/index.html";
}
hoje = new Date();

dia = hoje.getDate() + 0;

dias = hoje.getDay() + 1;

mes = hoje.getMonth() + 1;

ano = hoje.getYear();

var listBestPairTimes = [];
var listPairs = [
    "EUR_USD",

    "GBP_AUD",
    "EUR_AUD",
    "EUR_JPY",
    "GBP_CAD",
    "USD_JPY",
    "EUR_CHF",
    "AUD_CAD",
    "GBP_CHF",
    "EUR_GBP",
    "AUD_CHF",
    "CAD_JPY",
    "GBP_JPY",
    "EUR_CAD",
    "AUD_JPY",
    "GBP_NZD",
];

var percentageMin = 100;
var percentageMax = 100;
var candleTime = "M5";
var daysAnalyse = 20;
var martingales = 0;
var orderType = "PUT";
var timeInit = 2;
var timeEnd = 18;

var requestNumber = 0;

//First action when clicking on PROCESS DATA button
function getHistoric() {
    $("body").css("cursor", "progress");
    listBestPairTimes = [];
    getParameter();
    //I check if the Asset field is in All Assets if not it searches for the selected asset
    if (cbAtivo == 0) {
        requestNumber = listPairs.length;
    } else {
        listPairs = [cbAtivo];
        requestNumber = listPairs.length;
    }

    var count = CalculateCountCandles();
    if (count > 50000) {
        alert(
            "The number of candles exceeds 50,000, please decrease the number of days analyzed"
        );
        return;
    }

    for (var i = 0; i < listPairs.length; i++) {
        var currentPair = listPairs[i];
        callHistoricData(currentPair, count, cbAtivo);
    }
}

function getParameter() {
    percentageMin = $("#selPercentageMin").val();
    percentageMax = $("#selPercentageMax").val();
    candleTime = $("#selCandleTime").val();
    daysAnalyse = $("#selDays").val();
    martingales = $("#selMartingales").val();
    orderType = $("#selOrderType").val();
    timeInit = $("#selTimeInit").val();
    timeEnd = $("#selTimeEnd").val();
    cbAtivo = $("#cbAtivo").val();
}

function CalculateCountCandles() {
    var minutes = 15; // DEFAULT FOR M15
    switch (candleTime) {
        case "M2":
            minutes = 2;
            break;
        case "M2":
            minutes = 2;
            break;
        case "M10":
            minutes = 10;
            break;
        case "M15":
            minutes = 15;
            break;
        case "M30":
            minutes = 30;
            break;
        case "H1":
            minutes = 60;
            break;
        case "H2":
            minutes = 120;
            break;
        case "H4":
            minutes = 240;
            break;
    }

    var count = 60 / minutes;
    count = 24 * count;
    count = count * daysAnalyse;
    return count;
}

function callHistoricData(pair, count, cbAtivo) {
    var count_i = 0;
    if (cbAtivo == 0) {
        //var urlHist = "https://api-fxtrade.oanda.com/v1/candles?instrument="+pair+"&start=1565395200&end=1569283200&granularity=M1";
        //var urlHist = "https://api-fxtrade.oanda.com/v1/candles?instrument="+pair+"&start="+startDate+"&end="+endDate+"&granularity="+candleTime+"&candleFormat=midpoint";
        //var urlHist = "https://api-fxpractice.oanda.com/v3/instruments/"+pair+"/candles?from="+startDate+"&to="+endDate+"&granularity="+candleTime+"";
        var urlHist =
            "https://api-fxpractice.oanda.com/v3/instruments/" +
            pair +
            "/candles?granularity=" +
            candleTime +
            "&count=" +
            count;
        $.ajax({
            url: urlHist,
            headers: {
                Authorization:
                    "Bearer eb2326208921b413a87728832f191f03-d9be68b74884f7d3107b9f05ca305319",
            },
            type: "GET",
            success: function (result) {
                CalculateHistoric(result);
            },
        });
    } else {
        if (count_i == 0) {
            //(cbAtivo == pair && count_i == 0 ){
            //alert(cbAtivo);
            //count_i ++;
            var urlHist =
                "https://api-fxpractice.oanda.com/v3/instruments/" +
                pair +
                "/candles?granularity=" +
                candleTime +
                "&count=" +
                count;
            $.ajax({
                url: urlHist,
                headers: {
                    Authorization:
                        "Bearer  eb2326208921b413a87728832f191f03-d9be68b74884f7d3107b9f05ca305319",
                },
                type: "GET",
                success: function (result) {
                    CalculateHistoric(result);
                },
            });
        }
    }
}
function CalculateHistoric(result) {
    var candles = result.candles;
    var candlesResult = [];
    for (var i = 0; i < candles.length; i++) {
        var candle = candles[i];

        var item = new Object();
        item.resultValue = candle.mid.o - candle.mid.c;
        item.date = ConvertDate(candle.time);
        item.result = GetStringResult(item.resultValue);
        item.percentDif = (item.resultValue * 100) / candle.mid.o;
        if (item.result === orderType) {
            item.win = true;
        } else {
            item.win = false;
        }

        //if(CheckTime(item.date)){

        var arrayTime = item.date.time.split(":");

        if (
            parseInt(arrayTime[0]) < parseInt(timeInit) ||
            parseInt(arrayTime[0]) > parseInt(timeEnd)
        ) {
            continue;
        }
        candlesResult.push(item);
    }
    var martinGaleResult = candlesResult;
    if (martingales > 0) {
        martinGaleResult = [];
        for (var i = 0; i < candlesResult.length; i++) {
            var candle = candlesResult[i];
            candle.nextCandles = GetNextMartingales(candlesResult, i);
            candle.win =
                candle.win === false ? GetMartingaleResult(candle) : true;
            martinGaleResult.push(candle);
        }
    }

    var timeGroupedCandles = Array.from(
        new Set(martinGaleResult.map((s) => s.date.time))
    ).map((time) => {
        return {
            time: time,
            candles: martinGaleResult.filter((s) => s.date.time === time),
            pair: result.instrument,
        };
    });

    for (var i = 0; i < timeGroupedCandles.length; i++) {
        var currentGroup = timeGroupedCandles[i];

        currentGroup.winrate = 0;
        currentGroup.averageTickDif = 0;
        for (var z = 0; z < currentGroup.candles.length; z++) {
            var candle = currentGroup.candles[z];

            if (candle.win == true) {
                currentGroup.winrate++;
                currentGroup.averageTickDif += item.percentDif;
            }
        }
        currentGroup.averageTickDif =
            currentGroup.averageTickDif / currentGroup.winrate;

        currentGroup.winrate =
            (currentGroup.winrate * 100) / currentGroup.candles.length;

        if (
            currentGroup.winrate >= percentageMin &&
            currentGroup.winrate <= percentageMax
        ) {
            listBestPairTimes.push(currentGroup);
            continue;
        }
    }
    requestNumber--;
    if (requestNumber == 0) {
        DownloadTxt();
    }
}

function CheckTime(date) {
    var minDate = new Date();
    return true;
}

function GetMartingaleResult(candle) {
    var anyWin = candle.nextCandles.find((s) => s.win === true);

    return anyWin != undefined && anyWin != null > 0 ? true : false;
}

function GetNextMartingales(listCandles, index) {
    var nextCandles = [];
    var candle = listCandles[index];
    if (
        martingales > 0 &&
        parseInt(index) + parseInt(martingales) < listCandles.length
    ) {
        for (var i = 1; i <= martingales; i++) {
            var nextCandle = listCandles[index + i];
            nextCandles.push(nextCandle);
        }
        return nextCandles;
    } else {
        return nextCandles;
    }
}

function DownloadTxt() {
    if (listBestPairTimes.length <= 0) {
        // Reset cursor
        $("body").css("cursor", "default");
        alert("No signal found for the selected winrate and wales range.");
        return;
    }
    listBestPairTimes.sort((a, b) => (a.time > b.time ? 1 : -1));
    var listNumber = listBestPairTimes.length / 80;
    var i = 0;
    var stringList2 = "SIGNAL LIST _" + candleTime;
    for (var x = 0; x < listNumber; x++) {
        var index = 1;
        stringList2 += "\r\n " + "2024" + "-0" + mes + "-" + dia;

        for (; i < listBestPairTimes.length; i++) {
            var candle = listBestPairTimes[i];
            var arrayTime = candle.time.split(":");
            //alert(candle.pair);

            for (var z = 0; z < arrayTime.length; z++) {
                if (arrayTime[z] === "0") {
                    arrayTime[z] = "00";
                }
            }
            /*             stringList += "\r\nE" + index + "=---------Entrada_" + index + "---------"
            stringList += "\r\nHora_" + index + "=" + arrayTime[0];
            stringList += "\r\nMinuto_" + index + "=" + arrayTime[1];
            stringList += "\r\nTipo_" + index + "=" + orderType;
            stringList += "\r\nPAR_" + index + "=" + candle.pair.replace('_', '');
            stringList += "\r\nvalor_" + index + "=1.0";
            stringList += "\r\nExpiracao_" + index + "=" + candleTime.substring(1, candleTime.length);
            stringList += "\r\nPermitir_Entrada_" + index + "=true"; */

            stringList2 +=
                "\r\n " +
                candle.time +
                " " +
                candle.pair.replace("_", "") +
                "-OTC" +
                " " +
                orderType;
            //stringList2 += "\r\n" + Math.abs(candle.averageTickDif.toFixed(5));

            index++;

            if (i > 0 && (i + 1) % 80 == 0) {
                i++;
                break;
            }
        }

        /* 		stringList += "\r\ns_title_settings====== TRADING SETTINGS ============";
		stringList += "\r\nMartingaleType=0";
		stringList += "\r\nMartingaleSteps="+martingales;
		stringList += "\r\nMartingaleCoef=2.2"; */

        //download(percentageMin +" - " +percentageMax + '_' + orderType + '_' + candleTime + "ListaSinais_" +parseInt(x+1).toString() + ".set", stringList);
    }

    // Show the loading section when "Get Now" is clicked
    document.getElementById("loading").style.display = "block";

    setTimeout(function () {
        document.getElementById("loading").style.display = "none";

        download(
            percentageMin +
                " - " +
                percentageMax +
                "_" +
                orderType +
                "_" +
                candleTime +
                ".txt",
            stringList2
        );
    }, 4000); // 4 seconds delay for loading
}

function download(filename, text) {
    $("body").css("cursor", "default");
    var element = document.createElement("a");
    element.setAttribute(
        "href",
        "data:text/plain;charset=utf-8," + encodeURIComponent(text)
    );
    element.setAttribute("download", filename);

    element.style.display = "none";
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
}

function GetStringResult(value) {
    if (value > 0) {
        return "PUT";
    } else if (value < 0) {
        return "CALL";
    } else {
        return "DRAW";
    }
}

function ConvertDate(time) {
    var options = { timeZone: "Asia/Kolkata" }; // Set to Indian Standard Time
    var dateObj = new Date(time);
    var timeObj = new Object();
    timeObj.date = dateObj;

    var hours = ("0" + dateObj.getHours()).slice(-2); // Ensure two-digit representation
    var minutes = ("0" + dateObj.getMinutes()).slice(-2); // Ensure two-digit representation
    var seconds = ("0" + dateObj.getSeconds()).slice(-2); // Ensure two-digit representation

    timeObj.time = hours + ":" + minutes; // Custom 24-hour format

    return timeObj;
}

$("#formHist").submit(function (e) {
    e.preventDefault();
    return false;
});
function openHelpPopup() {
    document.getElementById("helpPopup").style.display = "block";
}

function closeHelpPopup() {
    document.getElementById("helpPopup").style.display = "none";
}
