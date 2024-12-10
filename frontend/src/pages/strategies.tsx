import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import StrategyForm from "../components/StrategyForm";

const Strategies = () => {
  return (
    <>
      <Navbar />
      <div className="container">
        <h2>Add a New Strategy</h2>
        <StrategyForm />
      </div>
      <Footer />
    </>
  );
};

export default Strategies;
