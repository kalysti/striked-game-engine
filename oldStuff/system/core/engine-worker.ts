import { parentPort } from "worker_threads";

while (true) {
    parentPort?.postMessage("asd");
}